package com.rnk.codepush;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.rna.core.RNKPackageInterface;
import com.rna.core.RNKRegistry;
import java.util.Arrays; 
import java.util.Collections;
import java.util.List;
import com.microsoft.codepush.react.CodePush;

public class RNKCodePushPackage implements ReactPackage, RNKPackageInterface {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList(); 
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
    @Override
    public void createEventManagers(RNKRegistry registry) {
        registry.add("host.getBundleFile", "codepush", (Object o) -> {
            String jsBundlePath = CodePush.getJSBundleFile();
            registry.set("jsBundleFile", jsBundlePath);
            return true;
        });
    }

}