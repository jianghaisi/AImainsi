package org.aimainsi.sequence;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SequenceVaultPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
