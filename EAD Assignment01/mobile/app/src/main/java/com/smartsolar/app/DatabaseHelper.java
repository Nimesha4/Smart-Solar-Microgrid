package com.smartsolar.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "SmartSolar.db";
    private static final int DATABASE_VERSION = 1;

    // Local user table for offline persistence
    private static final String TABLE_USER = "local_user";
    private static final String COL_NIC = "nic";
    private static final String COL_ROLE = "role";
    private static final String COL_NAME = "name";

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createTable = "CREATE TABLE " + TABLE_USER + " (" +
                COL_NIC + " TEXT PRIMARY KEY, " +
                COL_ROLE + " TEXT, " +
                COL_NAME + " TEXT)";
        db.execSQL(createTable);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USER);
        onCreate(db);
    }

    public void saveUserLocally(String nic, String role, String name) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COL_NIC, nic);
        values.put(COL_ROLE, role);
        values.put(COL_NAME, name);
        
        // Insert or replace to keep the local DB updated with the current logged in user
        db.insertWithOnConflict(TABLE_USER, null, values, SQLiteDatabase.CONFLICT_REPLACE);
        db.close();
    }

    public String[] getLocalUser() {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT * FROM " + TABLE_USER, null);
        
        if (cursor.moveToFirst()) {
            String[] user = new String[3];
            user[0] = cursor.getString(0); // nic
            user[1] = cursor.getString(1); // role
            user[2] = cursor.getString(2); // name
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
