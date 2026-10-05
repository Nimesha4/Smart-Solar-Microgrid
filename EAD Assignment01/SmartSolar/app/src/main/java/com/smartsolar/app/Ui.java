package com.smartsolar.app;

import android.content.Context;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.google.android.material.card.MaterialCardView;
import androidx.core.content.ContextCompat;

public class Ui {

    public static int dp(Context c, int v) {
        return Math.round(v * c.getResources().getDisplayMetrics().density);
    }

    public static TextView text(Context c, String s, float sp, int colorRes, boolean bold) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(ContextCompat.getColor(c, colorRes));
        t.setTypeface(t.getTypeface(), bold ? Typeface.BOLD : Typeface.NORMAL);
        return t;
    }

    public static TextView chip(Context c, String text, int bgDrawableRes, int textColorRes) {
        TextView tv = new TextView(c);
        tv.setText(text);
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        tv.setTypeface(tv.getTypeface(), Typeface.BOLD);
        tv.setTextColor(ContextCompat.getColor(c, textColorRes));
        tv.setBackgroundResource(bgDrawableRes);
        tv.setPadding(dp(c, 10), dp(c, 4), dp(c, 10), dp(c, 4));
        tv.setGravity(Gravity.CENTER);
        return tv;
    }

    public static LinearLayout col(Context c, int padDp) {
        LinearLayout l = new LinearLayout(c);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(c, padDp), dp(c, padDp), dp(c, padDp), dp(c, padDp));
        return l;
    }

    public static LinearLayout row(Context c, int padDp) {
        LinearLayout l = new LinearLayout(c);
        l.setOrientation(LinearLayout.HORIZONTAL);
        l.setGravity(Gravity.CENTER_VERTICAL);
        l.setPadding(dp(c, padDp), dp(c, padDp), dp(c, padDp), dp(c, padDp));
        return l;
    }

    public static MaterialCardView card(Context c) {
        MaterialCardView cv = new MaterialCardView(c);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(c, 10);
        lp.bottomMargin = dp(c, 2);
        cv.setLayoutParams(lp);
        cv.setRadius(dp(c, 16));
        cv.setCardElevation(dp(c, 3));
        cv.setStrokeColor(ContextCompat.getColor(c, R.color.brand_card_stroke));
        cv.setStrokeWidth(dp(c, 1));
        cv.setCardBackgroundColor(ContextCompat.getColor(c, R.color.brand_card_bg));
        return cv;
    }
}
