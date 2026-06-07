// Lightweight CSV exporter (no dependency)

const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
};

export const toCSV = (rows, columns) => {
    if (!rows || rows.length === 0) {
        return columns.map((c) => escapeCell(c.label)).join(',');
    }
    const header = columns.map((c) => escapeCell(c.label)).join(',');
    const body = rows.map((row) =>
        columns.map((c) => {
            const raw = typeof c.value === 'function' ? c.value(row) : row[c.key];
            return escapeCell(raw);
        }).join(',')
    );
    return [header, ...body].join('\n');
};

export const downloadCSV = (csv, filename = 'export.csv') => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const exportRows = (rows, columns, filename) => {
    const csv = toCSV(rows, columns);
    const stamp = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `${filename}-${stamp}.csv`);
};
