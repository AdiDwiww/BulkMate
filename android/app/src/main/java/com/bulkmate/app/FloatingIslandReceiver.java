package com.bulkmate.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

public class FloatingIslandReceiver extends BroadcastReceiver {

    private static View activeView;
    private static final Handler uiHandler = new Handler(Looper.getMainLooper());
    private static Runnable removeTask;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"SHOW_FI".equals(intent.getAction())) return;

        String label = intent.getStringExtra("label");
        String color = intent.getStringExtra("color");

        // Primary: start ForegroundService
        try {
            Intent svc = new Intent(context, FloatingIslandService.class);
            svc.setAction("SHOW");
            svc.putExtra("label", label);
            svc.putExtra("color", color);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(svc);
            } else {
                context.startService(svc);
            }
        } catch (Exception e) {
            // Fallback: show overlay directly from receiver if service fails
            showDirectOverlay(context, label != null ? label : "Pengingat",
                color != null ? color : "#22c55e");
        }
    }

    /** Fallback: show overlay directly without Service (for restricted devices) */
    private static void showDirectOverlay(Context ctx, String label, String colorHex) {
        if (!android.provider.Settings.canDrawOverlays(ctx)) return;

        uiHandler.post(() -> {
            removeDirectOverlay(ctx);

            WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
            int accent;
            try { accent = Color.parseColor(colorHex); }
            catch (Exception e) { accent = Color.parseColor("#22c55e"); }

            LinearLayout pill = buildPill(ctx, label, accent);
            pill.setOnClickListener(v -> removeDirectOverlay(ctx));

            activeView = pill;

            int wmType = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

            android.content.SharedPreferences prefs =
                ctx.getSharedPreferences("FloatingIslandPrefs", Context.MODE_PRIVATE);

            WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                wmType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                    | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            );
            lp.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            lp.y = prefs.getInt("camY", 6);
            lp.x = prefs.getInt("camX", 0);

            try {
                wm.addView(activeView, lp);
                // Entry animation
                activeView.setScaleX(0.7f); activeView.setScaleY(0.7f); activeView.setAlpha(0f);
                activeView.animate().scaleX(1f).scaleY(1f).alpha(1f).setDuration(350).start();

                if (removeTask != null) uiHandler.removeCallbacks(removeTask);
                removeTask = () -> removeDirectOverlay(ctx);
                uiHandler.postDelayed(removeTask, 8000);
            } catch (Exception ignored) {}
        });
    }

    private static void removeDirectOverlay(Context ctx) {
        if (activeView != null) {
            try {
                WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
                wm.removeView(activeView);
            } catch (Exception ignored) {}
            activeView = null;
        }
    }

    static LinearLayout buildPill(Context ctx, String label, int accent) {
        int dp = (int) ctx.getResources().getDisplayMetrics().density;

        LinearLayout pill = new LinearLayout(ctx);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);
        pill.setPadding(14 * dp, 7 * dp, 16 * dp, 7 * dp);
        pill.setElevation(10 * dp);

        // Background: dark pill with glow border
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(50 * dp);
        bg.setColor(Color.parseColor("#111111"));
        bg.setStroke(2, Color.argb(60, 255, 255, 255));
        pill.setBackground(bg);

        // Pulsing dot
        View dot = new View(ctx);
        LinearLayout.LayoutParams dotLp = new LinearLayout.LayoutParams(8 * dp, 8 * dp);
        dotLp.setMarginEnd(7 * dp);
        dot.setLayoutParams(dotLp);
        GradientDrawable dotBg = new GradientDrawable();
        dotBg.setShape(GradientDrawable.OVAL);
        dotBg.setColor(accent);
        dot.setBackground(dotBg);

        // Text
        TextView txt = new TextView(ctx);
        txt.setText("Waktunya " + label + "!");
        txt.setTextColor(Color.WHITE);
        txt.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f);
        txt.setTypeface(null, Typeface.BOLD);
        txt.setLetterSpacing(0.01f);
        txt.setMaxLines(1);

        pill.addView(dot);
        pill.addView(txt);
        return pill;
    }
}
