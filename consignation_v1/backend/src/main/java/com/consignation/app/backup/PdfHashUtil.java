package com.consignation.app.backup;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** Utilitaire de hachage SHA-256 pour détecter les changements de contenu et éviter les doublons. */
public final class PdfHashUtil {

    private PdfHashUtil() {
    }

    public static String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible", e);
        }
    }
}
