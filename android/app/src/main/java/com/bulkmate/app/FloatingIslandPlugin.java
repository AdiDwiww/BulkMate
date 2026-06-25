package com.bulkmate.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import java.util.Calendar;

@CapacitorPlugin(name = "FloatingIsland")
public class FloatingIslandPlugin extends Plugin {

    private static final String PREFS = "FloatingIslandPrefs";

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(getContext());
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            getActivity().runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName())
                    );
                    getActivity().startActivity(intent);
                } catch (Exception e) {
                    // Silently ignored — JS fallback handles this
                }
            });
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void saveCameraPosition(PluginCall call) {
        int x = call.getInt("offsetX", 0);
        int y = call.getInt("offsetY", 8);
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putInt("camX", x).putInt("camY", y).apply();
        call.resolve();
    }

    @PluginMethod
    public void scheduleAll(PluginCall call) {
        try {
            JSArray reminders = call.getArray("reminders");
            if (reminders == null) { call.resolve(); return; }

            AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            cancelAllAlarms(am);

            int alarmId = 2000;
            for (int i = 0; i < reminders.length(); i++) {
                JSONObject r = reminders.getJSONObject(i);
                if (!r.optBoolean("enabled", true)) continue;

                String time  = r.optString("time", "00:00");
                String label = r.optString("label", "Pengingat");
                String meal  = r.optString("mealType", "lunch");
                String color = mealColor(meal);
                String days  = r.optString("days", "daily");

                String[] tp  = time.split(":");
                int hour     = Integer.parseInt(tp[0]);
                int minute   = Integer.parseInt(tp[1]);

                // Schedule next 8 days
                for (int offset = 0; offset < 8; offset++) {
                    Calendar cal = Calendar.getInstance();
                    cal.add(Calendar.DAY_OF_YEAR, offset);
                    cal.set(Calendar.HOUR_OF_DAY, hour);
                    cal.set(Calendar.MINUTE, minute);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    if (cal.getTimeInMillis() <= System.currentTimeMillis()) continue;
                    if (!dayMatches(cal, days)) continue;

                    scheduleOne(am, alarmId++, cal.getTimeInMillis(), label, color);
                }
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Schedule error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        cancelAllAlarms(am);
        call.resolve();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void scheduleOne(AlarmManager am, int id, long triggerAt, String label, String color) {
        Intent intent = new Intent(getContext(), FloatingIslandReceiver.class);
        intent.setAction("SHOW_FI");
        intent.putExtra("label", label);
        intent.putExtra("color", color);
        intent.putExtra("alarmId", id);

        PendingIntent pi = PendingIntent.getBroadcast(
            getContext(), id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Exception e) {
            am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    private void cancelAllAlarms(AlarmManager am) {
        for (int id = 2000; id < 2100; id++) {
            Intent intent = new Intent(getContext(), FloatingIslandReceiver.class);
            intent.setAction("SHOW_FI");
            PendingIntent pi = PendingIntent.getBroadcast(
                getContext(), id, intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) { am.cancel(pi); pi.cancel(); }
        }
    }

    private boolean dayMatches(Calendar cal, String days) {
        int dow = cal.get(Calendar.DAY_OF_WEEK); // 1=Sun
        if ("daily".equals(days)) return true;
        if ("weekdays".equals(days)) return dow >= Calendar.MONDAY && dow <= Calendar.FRIDAY;
        if ("weekends".equals(days)) return dow == Calendar.SATURDAY || dow == Calendar.SUNDAY;
        return true;
    }

    private String mealColor(String type) {
        if ("breakfast".equals(type)) return "#f97316";
        if ("dinner".equals(type))    return "#6366f1";
        if ("snack".equals(type))     return "#a855f7";
        return "#22c55e";
    }
}
