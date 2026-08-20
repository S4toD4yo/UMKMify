/**
 * Money and date formatting shared by every page. The API sends money as
 * decimal(15,2) strings ("9000000.00") and timestamps as ISO 8601.
 */

/** "9000000.00" -> "Rp 9.000.000". The forms only take whole rupiah. */
export function formatRupiah(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "Rp 0";
    }

    return "Rp " + amount.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

/** "20 Aug 2026" — the Created Date column and the product page. */
export function formatDate(value) {
    const date = toDate(value);

    if (!date) {
        return "-";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/** "20 Aug 2026, 19:04" — an order needs the time as well as the day. */
export function formatDateTime(value) {
    const date = toDate(value);

    if (!date) {
        return "-";
    }

    return (
        formatDate(value) +
        ", " +
        date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
}

/** "pending" -> "Pending", for the status badges. */
export function titleCase(value) {
    const text = String(value ?? "");

    return text.charAt(0).toUpperCase() + text.slice(1);
}

function toDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}
