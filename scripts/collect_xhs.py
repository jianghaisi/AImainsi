"""Optional read-only Spider_XHS bridge. Requires the user's own valid login."""
import argparse
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import time
import urllib.parse
import urllib.request


def collect(repo: Path, query: str, limit: int):
    if not (repo / "apis" / "xhs_pc_apis.py").is_file():
        raise RuntimeError("--repo must point to an installed Spider_XHS checkout")
    cookie = os.environ.get("XHS_COOKIE", "")
    if not cookie:
        raise RuntimeError("Set XHS_COOKIE in the environment; never pass it on the command line")
    sys.path.insert(0, str(repo))
    previous = Path.cwd()
    auth = None
    try:
        os.chdir(repo)
        # Upstream diagnostics may contain request information; do not expose it.
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            from loguru import logger
            logger.remove()
            from apis.xhs_pc_apis import XHS_Apis
            from xhs_utils.xhs_pc import XHSPcAuth
            auth = XHSPcAuth.from_cookie(cookie)
            client = XHS_Apis(auth).bootstrap()
            ok, _, notes = client.search_some_note(query, limit, sort_type_choice=1)
            if not ok:
                raise RuntimeError("Search failed; verify your login and upstream compatibility")
            output = []
            for item in notes:
                note_id = item.get("id") or item.get("note_id")
                if not note_id:
                    continue
                token = item.get("xsec_token", "")
                public_url = f"https://www.xiaohongshu.com/explore/{note_id}"
                detail_url = public_url + "?" + urllib.parse.urlencode({"xsec_token": token, "xsec_source": "pc_search"})
                ok, _, result = client.get_note_info(detail_url)
                if not ok:
                    continue
                cards = (result or {}).get("data", {}).get("items", [])
                if cards:
                    card = cards[0].get("note_card", {})
                    output.append({"title": card.get("title", ""), "desc": card.get("desc", ""), "url": public_url})
                time.sleep(2)
            return output
    finally:
        if auth is not None and callable(getattr(auth, "close", None)):
            auth.close()
        os.chdir(previous)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--query", default="华为 AI 算法 面经")
    parser.add_argument("--company", default="华为")
    parser.add_argument("--limit", default=10, type=int)
    parser.add_argument("--output", type=Path, default=Path(".data/xhs-notes.json"))
    parser.add_argument("--ingest-url", default="", help="e.g. http://127.0.0.1:4178")
    parser.add_argument("--interval-hours", type=float, default=0, help="0 runs once; otherwise at least 1 hour")
    args = parser.parse_args()
    if not 1 <= args.limit <= 50:
        parser.error("limit must be between 1 and 50")
    if args.interval_hours and args.interval_hours < 1:
        parser.error("interval must be at least 1 hour")
    if args.ingest_url:
        parsed = urllib.parse.urlparse(args.ingest_url)
        if parsed.hostname not in ("127.0.0.1", "localhost") or parsed.scheme != "http" or parsed.username:
            parser.error("ingest-url must be the local HTTP application")
    args.repo, args.output = args.repo.resolve(), args.output.resolve()
    while True:
        try:
            records = collect(args.repo, args.query, args.limit)
            if not records:
                raise RuntimeError("No note details returned; no import was performed")
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Collected {len(records)} notes into {args.output}")
            if args.ingest_url:
                body = json.dumps({"records": records, "company": args.company}).encode()
                request = urllib.request.Request(args.ingest_url.rstrip("/") + "/api/sources/import", data=body, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(request, timeout=30) as response:
                    result = json.load(response)
                print(f"Imported {result['added']} pending records; skipped {result['duplicate']} duplicates")
        except Exception:
            # Do not stringify upstream exceptions: they may include cookies.
            print("Collection/import failed. Check repository dependencies, login validity and local server. No credentials were logged.", file=sys.stderr)
            if not args.interval_hours:
                return 1
        if not args.interval_hours:
            return 0
        time.sleep(args.interval_hours * 3600)


if __name__ == "__main__":
    raise SystemExit(main())
