package org.aimainsi.sequence;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.KeyStore;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SequenceVault")
public class SequenceVaultPlugin extends Plugin {
    private static final String ALIAS = "sequence-api-v1";
    private SharedPreferences prefs() {return getContext().getSharedPreferences("sequence-secrets", Context.MODE_PRIVATE);}
    private boolean allowed(String key) {return "apiKey".equals(key) || "judgeKey".equals(key);}
    private SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");store.load(null);
        if (store.containsAlias(ALIAS)) return (SecretKey)store.getKey(ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
        return generator.generateKey();
    }
    @PluginMethod public void get(PluginCall call) {
        String name = call.getString("key");if(!allowed(name)){call.reject("Unknown key");return;}
        try {
            String encoded = prefs().getString(name, ""), value = "";
            if(!encoded.isEmpty()) {
                String[] parts = encoded.split(":", 2);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));
                value = new String(cipher.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),StandardCharsets.UTF_8);
            }
            JSObject result = new JSObject();result.put("value", value);call.resolve(result);
        } catch(Exception e) {call.reject("Cannot unlock device credential. Clear and configure it again.");}
    }
    @PluginMethod public void set(PluginCall call) {
        String name = call.getString("key"), value = call.getString("value", "");
        if(!allowed(name)){call.reject("Unknown key");return;}
        try {
            if(value.isEmpty()) {prefs().edit().remove(name).apply();call.resolve();return;}
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            String encoded = Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(encrypted,Base64.NO_WRAP);
            if(!prefs().edit().putString(name,encoded).commit())throw new Exception("storage");
            call.resolve();
        }catch(Exception e){call.reject("Cannot store device credential");}
    }
}
