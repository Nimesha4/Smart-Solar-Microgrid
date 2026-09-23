package com.smartsolar.app;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class DateUtils {

    private static final SimpleDateFormat ISO =
            new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
    private static final SimpleDateFormat ISO_NO_MS =
            new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
    static {
        ISO.setTimeZone(TimeZone.getTimeZone("UTC"));
        ISO_NO_MS.setTimeZone(TimeZone.getTimeZone("UTC"));
    }

    public static String toIso(Date d) { return ISO.format(d); }

    public static Date parseIso(String s) {
        if (s == null) return null;
        try { return ISO.parse(s); }
        catch (Exception e) {
            try { return ISO_NO_MS.parse(s); } catch (Exception ignored) { return null; }
        }
    }

    public static String display(String iso) {
        Date d = parseIso(iso);
        if (d == null) return iso == null ? "-" : iso;
        return new SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(d);
    }
}