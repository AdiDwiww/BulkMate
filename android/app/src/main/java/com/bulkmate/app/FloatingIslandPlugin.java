package com.bulkmate.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Calendar;

@CapacitorPlugin(name = "FloatingIsland")
public class FloatingIslandPlugin extends Plugin {

    private static final String PREFS = "FloatingIslandPrefs";

    // ── Permission ────────────────────────────────────────────────────────────

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = (Build.VERSION.SDK_INT < Build.VERSION_CODES.M)
            || Settings.canDrawOverlays(getContext());
        JSObject r = new JSObject(); r.put("granted", granted); call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            getActivity().runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName()));
                    getActivity().startActivity(i);
                } catch (Exception ignored) {}
            });
        }
        call.resolve(new JSObject());
    }

    // ── Camera position ───────────────────────────────────────────────────────

    @PluginMethod
    public void saveCameraPosition(PluginCall call) {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt("camX", call.getInt("offsetX", 0))
            .putInt("camY", call.getInt("offsetY", 8))
            .apply();
        call.resolve(new JSObject());
    }

    // ── Direct show/hide (for testing + in-app trigger) ───────────────────────

    @PluginMethod
    public void show(PluginCall call) {
        android.util.Log.d("BulkMate-Alarm", "[Plugin] show called");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            JSObject r = new JSObject(); r.put("error", "no_permission"); call.resolve(r); return;
        }
        String label = call.getString("label", "Pengingat");
        String color = call.getString("color", "#22c55e");
        startOverlayService("SHOW", label, color);
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void hide(PluginCall call) {
        startOverlayService("HIDE", null, null);
        call.resolve(new JSObject());
    }

    // ── Schedule via AlarmManager ─────────────────────────────────────────────

    @PluginMethod
    public void scheduleAll(PluginCall call) {
        String json = call.getString("remindersJson", "[]");
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        cancelAllAlarms(am);
        try {
            JSONArray arr = new JSONArray(json);
            StringBuilder activeIds = new StringBuilder();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject r = arr.getJSONObject(i);
                if (!r.optBoolean("enabled", true)) continue;
                String[] tp = r.optString("time", "00:00").split(":");
                int hour = Integer.parseInt(tp[0]), minute = Integer.parseInt(tp[1]);
                String label = r.optString("label", "Pengingat");
                String color = mealColor(r.optString("mealType", "lunch"));
                String days  = r.optString("days", "daily");
                int baseId = r.optInt("id", (i + 1) * 1000);
                for (int offset = 0; offset < 8; offset++) {
                    Calendar cal = Calendar.getInstance();
                    cal.add(Calendar.DAY_OF_YEAR, offset);
                    cal.set(Calendar.HOUR_OF_DAY, hour);
                    cal.set(Calendar.MINUTE, minute);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    if (cal.getTimeInMillis() <= System.currentTimeMillis()) continue;
                    if (!dayMatch(cal, days)) continue;
                    int piId = baseId * 10 + offset;
                    scheduleOne(am, piId, cal.getTimeInMillis(), label, color);
                    activeIds.append(piId).append(",");
                }
            }
            getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putString("activeIds", activeIds.toString()).apply();
        } catch (Exception e) { call.reject("Parse: " + e.getMessage()); return; }
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        cancelAllAlarms((AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE));
        call.resolve(new JSObject());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void startOverlayService(String action, String label, String color) {
        Intent svc = new Intent(getContext(), FloatingIslandService.class);
        svc.setAction(action);
        if (label != null) svc.putExtra("label", label);
        if (color != null) svc.putExtra("color", color);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(svc);
        } else {
            getContext().startService(svc);
        }
    }

    private void scheduleOne(AlarmManager am, int id, long at, String label, String color) {
        android.util.Log.d("BulkMate-Alarm", "[AlarmManager] scheduled reminder: " + label + " id: " + id);
        Intent intent = new Intent(getContext(), FloatingIslandReceiver.class);
        intent.setAction("SHOW_FI");
        intent.putExtra("label", label);
        intent.putExtra("color", color);
        PendingIntent pi = PendingIntent.getBroadcast(getContext(), id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(at, pi);
                am.setAlarmClock(info, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (Exception e) { am.set(AlarmManager.RTC_WAKEUP, at, pi); }
    }

    private void cancelAllAlarms(AlarmManager am) {
        String ids = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("activeIds", "");
        if (ids.isEmpty()) return;
        for (String idStr : ids.split(",")) {
            if (idStr.isEmpty()) continue;
            try {
                int id = Integer.parseInt(idStr);
                Intent i = new Intent(getContext(), FloatingIslandReceiver.class);
                i.setAction("SHOW_FI");
                PendingIntent pi = PendingIntent.getBroadcast(getContext(), id, i,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
                if (pi != null) { am.cancel(pi); pi.cancel(); }
            } catch (Exception ignored) {}
        }
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("activeIds", "").apply();
    }

    private boolean dayMatch(Calendar c, String days) {
        int d = c.get(Calendar.DAY_OF_WEEK);
        if ("daily".equals(days)) return true;
        if ("weekdays".equals(days)) return d >= Calendar.MONDAY && d <= Calendar.FRIDAY;
        if ("weekends".equals(days)) return d == Calendar.SATURDAY || d == Calendar.SUNDAY;
        return true;
    }

    private String mealColor(String t) {
        if ("breakfast".equals(t)) return "#f97316";
        if ("dinner".equals(t))    return "#6366f1";
        if ("snack".equals(t))     return "#a855f7";
        return "#22c55e";
    }
}
