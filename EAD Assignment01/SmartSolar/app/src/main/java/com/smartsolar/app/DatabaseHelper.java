package com.smartsolar.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "SmartSolar.db";
    private static final int DATABASE_VERSION = 1;
    private static final String TABLE_USER = "local_user";

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + TABLE_USER +
                " (nic TEXT PRIMARY KEY, role TEXT, name TEXT, email TEXT)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USER);
        onCreate(db);
    }

    public void saveUserLocally(String nic, String role, String name, String email) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues v = new ContentValues();
        v.put("nic", nic);
        v.put("role", role);
        v.put("name", name);
        v.put("email", email);
        db.insertWithOnConflict(TABLE_USER, null, v, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }

    /** @return {nic, role, name, email} or null */
    public String[] getLocalUser() {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT * FROM " + TABLE_USER, null);
        if (cursor.moveToFirst()) {
            String[] user = { cursor.getString(0), cursor.getString(1),
                    cursor.getString(2), cursor.getString(3) };
            cursor.close();
            return user;
        }
        cursor.close();
        return null;
    }

    public void clearLocalUser() {
        SQLiteDatabase db = this.getWritableDatabase();
        db.execSQL("DELETE FROM " + TABLE_USER);
        db.close();
    }
}