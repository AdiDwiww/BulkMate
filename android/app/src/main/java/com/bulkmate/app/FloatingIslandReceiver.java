package com.bulkmate.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class FloatingIslandReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"SHOW_FI".equals(intent.getAction())) return;

        Intent svc = new Intent(context, FloatingIslandService.class);
        svc.setAction("SHOW");
        svc.putExtra("label",   intent.getStringExtra("label"));
        svc.putExtra("color",   intent.getStringExtra("color"));
        svc.putExtra("alarmId", intent.getIntExtra("alarmId", 0));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(svc);
        } else {
            context.startService(svc);
        }
    }
}
