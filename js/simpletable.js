/**
 * SimpleTable v1.0.7 - Global Core Library
 * Lightweight, dependency-free table library
 * https://github.com/alicom13/simpletable
 */

class SimpleTable {
    constructor(table, perPage = 10) {
        if (!table) {
            throw new Error('Table element is required');
        }

        this.table = table;
        this.tbody = table.querySelector("tbody");
        this.rows = Array.from(this.tbody.querySelectorAll("tr"));
        this.filteredRows = [...this.rows];
        this.page = 1;
        this.perPage = perPage;
        this.sortColumn = null;
        this.sortDirection = "asc";
        this.searchTerm = '';

        this.checkboxState = new WeakMap();
        this.searchHandler = this.debounce(this.setSearch.bind(this), 300);

        this.createControls();
        this.enableSorting();
        this.initCheckboxes();
        this.render();
    }

    createControls() {
        const container = document.createElement("div");
        container.className = "simpletable-container";

        const wrap = document.createElement("div");
        wrap.className = "simpletable-controls";

        const searchContainer = document.createElement("div");
        searchContainer.className = "simpletable-search";

        this.searchBox = document.createElement("input");
        this.searchBox.placeholder = "Search...";
        this.searchBox.addEventListener('input', (e) => this.searchHandler(e.target.value));

        const controlsRight = document.createElement("div");
        controlsRight.className = "simpletable-controls-right";

        // Export Button Group
        const exportGroup = document.createElement("div");
        exportGroup.className = "simpletable-export-group";

        // CSV Button
        this.csvBtn = document.createElement("button");
        this.csvBtn.className = "simpletable-export-btn csv";
        this.csvBtn.innerHTML = '📊';
        this.csvBtn.title = "Export to CSV";
        this.csvBtn.onclick = () => this.exportToCSV();

        // Excel Button  
        this.excelBtn = document.createElement("button");
        this.excelBtn.className = "simpletable-export-btn excel";
        this.excelBtn.innerHTML = '📗';
        this.excelBtn.title = "Export to Excel";
        this.excelBtn.onclick = () => this.exportToExcel();

        exportGroup.appendChild(this.csvBtn);
        exportGroup.appendChild(this.excelBtn);

        this.perPageSelect = document.createElement("select");
        this.perPageSelect.className = "simpletable-perpage";

        // Text lebih pendek untuk padding yang bagus
        this.perPageSelect.innerHTML =
            '<option value="5">5</option>' +
            '<option value="10">10</option>' +
            '<option value="20">20</option>' +
            '<option value="50">50</option>' +
            '<option value="100">100</option>';

        this.perPageSelect.value = this.perPage;
        this.perPageSelect.addEventListener('change', () => {
            this.perPage = parseInt(this.perPageSelect.value);
            this.page = 1;
            this.render();
        });

        this.selectionCounter = document.createElement("span");
        this.selectionCounter.className = "simpletable-selection";
        this.updateSelectionCounter();

        searchContainer.appendChild(this.searchBox);
        controlsRight.appendChild(exportGroup);
        controlsRight.appendChild(this.perPageSelect);
        controlsRight.appendChild(this.selectionCounter);

        wrap.appendChild(searchContainer);
        wrap.appendChild(controlsRight);
        container.appendChild(wrap);

        this.table.parentNode.insertBefore(container, this.table);
        container.appendChild(this.table);

        this.paginationContainer = document.createElement("div");
        this.paginationContainer.className = "simpletable-pagination";
        container.appendChild(this.paginationContainer);

        this.infoContainer = document.createElement("div");
        this.infoContainer.className = "simpletable-info";
        container.appendChild(this.infoContainer);

        this.updateInfo();
    }

    enableSorting() {
        const headers = this.table.querySelectorAll("thead th");

        headers.forEach((th, index) => {
            if (th.querySelector("input, select, button")) return;

            th.style.cursor = "pointer";
            th.addEventListener("click", () => this.handleSort(index));
        });
    }

    handleSort(index) {
        const headers = this.table.querySelectorAll("thead th");
        headers.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });

        if (this.sortColumn === index) {
            this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
        } else {
            this.sortColumn = index;
            this.sortDirection = "asc";
        }

        headers[index].classList.add('sort-' + this.sortDirection);
        this.sortRows();
        this.render();
    }

    sortRows() {
        if (this.sortColumn === null) return;

        this.filteredRows.sort((a, b) => {
            const cellA = a.children[this.sortColumn];
            const cellB = b.children[this.sortColumn];

            if (!cellA || !cellB) return 0;

            const textA = cellA.textContent.trim().toLowerCase();
            const textB = cellB.textContent.trim().toLowerCase();

            const numA = parseFloat(textA);
            const numB = parseFloat(textB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return this.sortDirection === "asc" ? numA - numB : numB - numA;
            }

            return this.sortDirection === "asc"
                ? textA.localeCompare(textB)
                : textB.localeCompare(textA);
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    setSearch(value) {
        this.searchTerm = value.toLowerCase().trim();
        this.filteredRows = this.rows.filter(tr =>
            tr.textContent.toLowerCase().includes(this.searchTerm)
        );

        if (this.sortColumn !== null) this.sortRows();
        this.page = 1;
        this.render();
    }

    paginateRows() {
        const start = (this.page - 1) * this.perPage;
        return this.filteredRows.slice(start, start + this.perPage);
    }

    renderTable() {
        const existingEmpty = this.tbody.querySelector('.simpletable-empty');
        if (existingEmpty) {
            existingEmpty.remove();
        }

        this.rows.forEach(tr => tr.style.display = "none");

        if (this.filteredRows.length === 0) {
            this.showEmptyState();
            return;
        }

        const visibleRows = this.paginateRows();
        visibleRows.forEach(tr => tr.style.display = "");

        this.restoreCheckboxes();
        this.updateRowNumbers(visibleRows);
        this.updateSelectionCounter();
        this.updateInfo();
    }

    showEmptyState() {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'simpletable-empty';
        const colCount = this.table.querySelectorAll('thead th').length;
        emptyRow.innerHTML = '<td colspan="' + colCount + '">No data found</td>';
        this.tbody.appendChild(emptyRow);
    }

    updateRowNumbers(visibleRows) {
        const startNumber = (this.page - 1) * this.perPage + 1;
        visibleRows.forEach((row, index) => {
            const numberCell = row.querySelector('.row-number');
            if (numberCell) {
                numberCell.textContent = startNumber + index;
            }
        });
    }

    updateInfo() {
        const total = this.filteredRows.length;
        const start = total === 0 ? 0 : (this.page - 1) * this.perPage + 1;
        const end = Math.min(this.page * this.perPage, total);

        this.infoContainer.textContent = 'Showing ' + start + ' to ' + end + ' of ' + total + ' entries';
    }

    renderPagination() {
        const pag = this.paginationContainer;
        const totalPages = Math.ceil(this.filteredRows.length / this.perPage);

        if (totalPages <= 1) {
            pag.innerHTML = '';
            return;
        }

        const prevDisabled = this.page === 1;
        const nextDisabled = this.page >= totalPages;

        let paginationHTML = '<button ' + (prevDisabled ? 'disabled' : '') + '>‹ Prev</button>';

        const pages = this.getVisiblePages(totalPages);
        pages.forEach(pageNum => {
            if (pageNum === '...') {
                paginationHTML += '<button disabled>...</button>';
            } else {
                const activeClass = pageNum === this.page ? 'active' : '';
                paginationHTML += '<button class="' + activeClass + '">' + pageNum + '</button>';
            }
        });

        paginationHTML += '<button ' + (nextDisabled ? 'disabled' : '') + '>Next ›</button>';
        pag.innerHTML = paginationHTML;

        pag.querySelector('button:first-child').addEventListener('click', () => {
            if (!prevDisabled) {
                this.page--;
                this.render();
            }
        });

        pag.querySelector('button:last-child').addEventListener('click', () => {
            if (!nextDisabled) {
                this.page++;
                this.render();
            }
        });

        pag.querySelectorAll('button:not(:first-child):not(:last-child)').forEach((btn) => {
            if (!btn.disabled && btn.textContent !== '...') {
                btn.addEventListener('click', () => {
                    this.page = parseInt(btn.textContent);
                    this.render();
                });
            }
        });
    }

    getVisiblePages(totalPages) {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (this.page <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }

        if (this.page >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, '...', this.page - 1, this.page, this.page + 1, '...', totalPages];
    }

    initCheckboxes() {
        this.tbody.addEventListener("change", e => {
            const checkbox = e.target;
            if (checkbox.type === "checkbox") {
                this.checkboxState.set(checkbox, checkbox.checked);
                this.updateSelectionCounter();
            }
        });

        const selectAll = this.table.querySelector("thead input[type=checkbox]");
        if (selectAll) {
            selectAll.addEventListener("change", e => {
                const isChecked = e.target.checked;
                this.paginateRows().forEach(tr => {
                    const cb = tr.querySelector("input[type=checkbox]");
                    if (cb) {
                        cb.checked = isChecked;
                        this.checkboxState.set(cb, isChecked);
                    }
                });
                this.updateSelectionCounter();
            });
        }
    }

    restoreCheckboxes() {
        this.paginateRows().forEach(tr => {
            const cb = tr.querySelector("input[type=checkbox]");
            if (cb && this.checkboxState.has(cb)) {
                cb.checked = this.checkboxState.get(cb);
            }
        });
        this.updateSelectAllCheckbox();
    }

    updateSelectAllCheckbox() {
        const selectAll = this.table.querySelector("thead input[type=checkbox]");
        if (selectAll) {
            const visibleCheckboxes = this.paginateRows()
                .map(tr => tr.querySelector("input[type=checkbox]"))
                .filter(cb => cb);

            if (visibleCheckboxes.length === 0) {
                selectAll.checked = false;
                selectAll.disabled = true;
            } else {
                selectAll.disabled = false;
                const allChecked = visibleCheckboxes.every(cb => cb.checked);
                selectAll.checked = allChecked;
            }
        }
    }

    updateSelectionCounter() {
        const selected = this.getSelectedCount();
        const total = this.filteredRows.length;
        this.selectionCounter.textContent = selected + ' of ' + total + ' selected';
    }

    getSelectedCount() {
        let count = 0;
        this.filteredRows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) {
                count++;
            }
        });
        return count;
    }

    getTableHeaders() {
        const headers = [];
        this.table.querySelectorAll('thead th').forEach(th => {
            // Skip checkbox, "No", dan kolom dengan class no-export
            if (!th.querySelector('input[type="checkbox"]') &&
                th.textContent.trim() !== 'No' &&
                !th.classList.contains('no-export')) {
                headers.push(th.textContent.trim());
            }
        });
        return headers;
    }

    getExportData(rows = null) {
        const dataRows = rows || this.filteredRows;
        const headers = this.getTableHeaders();

        return dataRows.map(row => {
            const obj = {};
            const cells = row.querySelectorAll('td');
            let dataIndex = 0;

            this.table.querySelectorAll('thead th').forEach((th, i) => {
                // Skip checkbox, "No", dan kolom dengan class no-export
                if (!th.querySelector('input[type="checkbox"]') &&
                    th.textContent.trim() !== 'No' &&
                    !th.classList.contains('no-export') &&
                    cells[i] && headers[dataIndex]) {

                    const cell = cells[i].cloneNode(true);
                    cell.querySelector('button')?.remove();
                    obj[headers[dataIndex]] = cell.textContent.trim();
                    dataIndex++;
                }
            });

            return obj;
        });
    }

    exportToCSV() {
        const data = this.getExportData();
        const csv = this.convertToCSV(data);
        this.downloadFile(csv, 'table-export-' + this.getTimestamp() + '.csv', 'text/csv');
    }

    exportToExcel() {
        if (typeof XLSX === 'undefined') {
            alert('Excel export requires SheetJS library. Falling back to CSV.');
            return this.exportToCSV();
        }

        const data = this.getExportData();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, 'table-export-' + this.getTimestamp() + '.xlsx');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header] || '';
                    const escaped = value.toString().replace(/"/g, '""');
                    return escaped.includes(',') ? '"' + escaped + '"' : escaped;
                }).join(',')
            )
        ];

        return csvRows.join('\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getTimestamp() {
        return new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    }

    render() {
        this.renderTable();
        this.renderPagination();
    }

    updateData(newRows) {
        if (Array.isArray(newRows)) {
            this.rows = newRows;
        } else if (typeof newRows === 'string') {
            this.tbody.innerHTML = newRows;
            this.rows = Array.from(this.tbody.querySelectorAll("tr"));
        }

        this.filteredRows = [...this.rows];
        this.page = 1;
        this.render();
    }

    destroy() {
        const container = this.table.parentNode;
        if (container.classList.contains('simpletable-container')) {
            container.parentNode.insertBefore(this.table, container);
            container.remove();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.simpleTables = [];
    document.querySelectorAll(".simpletable").forEach(table => {
        try {
            const instance = new SimpleTable(table, 10);
            window.simpleTables.push(instance);
        } catch (error) {
            console.error('SimpleTable initialization error:', error);
        }
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleTable;
}
