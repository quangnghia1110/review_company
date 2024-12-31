let companiesData = [];
let currentPage = 1;
let itemsPerPage = 10;

// Thêm biến để lưu trữ bộ lọc hiện tại
let currentFilters = {
    region: '',
    advice: '',
    searchText: ''
};

// Đợi DOM load xong mới thực thi code
document.addEventListener('DOMContentLoaded', function() {
    // Fetch data from JSON file
    fetch('/main.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Lọc bỏ các công ty không có tên hoặc dữ liệu rỗng
            companiesData = data.companies.filter(company => 
                company.name && 
                company.name.trim() !== '' &&
                (company.disadvantages.length > 0 || 
                 company.advantages || 
                 company.notes || 
                 company.advice)
            );
            displayAllCompanies();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('results').innerHTML = '<div class="no-results">Lỗi khi tải dữ liệu</div>';
        });

    // Thêm sự kiện tìm kiếm khi nhấn Enter
    document.getElementById('searchInput')?.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            searchCompanies();
        }
    });
});

function searchCompanies() {
    currentFilters.searchText = document.getElementById('searchInput').value.toLowerCase();
    applyFilters();
}

function displayAllCompanies() {
    currentPage = 1;
    currentFilters = {
        region: '',
        advice: '',
        searchText: ''
    };
    
    // Thêm kiểm tra null
    const regionFilter = document.getElementById('regionFilter');
    const adviceFilter = document.getElementById('adviceFilter');
    const searchInput = document.getElementById('searchInput');

    if (regionFilter) regionFilter.value = '';
    if (adviceFilter) adviceFilter.value = '';
    if (searchInput) searchInput.value = '';

    displayResults(companiesData);
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results">Không tìm thấy kết quả nào</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    // Tính toán phân trang
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedResults = results.slice(start, end);

    let html = '<div class="table-container"><table>';
    html += `
        <tr>
            <th>Tên công ty</th>
            <th>Khu vực</th>
            <th>Địa chỉ</th>
            <th>Ưu điểm</th>
            <th>Nhược điểm</th>
            <th>Lời khuyên</th>
            <th>Ghi chú</th>
        </tr>
    `;

    paginatedResults.forEach(company => {
        // Xử lý dữ liệu trước khi hiển thị
        const processField = (field) => {
            if (Array.isArray(field)) {
                return field.join('<br>');
            }
            if (typeof field === 'string' && field.trim() !== '') {
                return field;
            }
            return '';
        };

        html += `
            <tr>
                <td><strong>${company.name || ''}</strong></td>
                <td>${company.region || ''}</td>
                <td>${company.address || ''}</td>
                <td class="advantages">${processField(company.advantages)}</td>
                <td class="disadvantages">${processField(company.disadvantages)}</td>
                <td class="advice">${processField(company.advice)}</td>
                <td class="notes">${processField(company.notes)}</td>
            </tr>
        `;
    });

    html += '</table></div>';
    resultsDiv.innerHTML = html;

    // Luôn hiển thị phân trang nếu có kết quả
    if (results.length > 0) {
        displayPagination(totalPages, results);
    } else {
        document.getElementById('pagination').innerHTML = '';
    }
}

function displayPagination(totalPages, results) {
    const paginationDiv = document.getElementById('pagination');
    let paginationHtml = '';

    // Nút Previous
    paginationHtml += `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `;

    // Hiển thị tối đa 5 nút trang
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    // Nút trang đầu
    if (startPage > 1) {
        paginationHtml += `
            <button onclick="changePage(1)">1</button>
            ${startPage > 2 ? '<span>...</span>' : ''}
        `;
    }

    // Các nút số trang
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button onclick="changePage(${i})" 
                    class="${currentPage === i ? 'active' : ''}">
                ${i}
            </button>
        `;
    }

    // Nút trang cuối
    if (endPage < totalPages) {
        paginationHtml += `
            ${endPage < totalPages - 1 ? '<span>...</span>' : ''}
            <button onclick="changePage(${totalPages})">${totalPages}</button>
        `;
    }

    // Nút Next
    paginationHtml += `
        <button onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;

    paginationDiv.innerHTML = paginationHtml;
}

function changePage(newPage) {
    const totalPages = Math.ceil(companiesData.length / itemsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    displayResults(companiesData);
}

function changeRowsPerPage() {
    const selectedValue = document.getElementById('rowsPerPage').value;
    if (selectedValue === 'all') {
        itemsPerPage = companiesData.length; // Hiển thị tất cả
    } else {
        itemsPerPage = parseInt(selectedValue);
    }
    currentPage = 1; // Reset về trang đầu tiên
    displayResults(companiesData);
}

function applyFilters() {
    const regionFilter = document.getElementById('regionFilter');
    const adviceFilter = document.getElementById('adviceFilter');
    const searchInput = document.getElementById('searchInput');

    currentFilters.region = regionFilter ? regionFilter.value : '';
    currentFilters.advice = adviceFilter ? adviceFilter.value : '';
    currentFilters.searchText = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredResults = companiesData.filter(company => {
        const matchRegion = !currentFilters.region || 
            company.region?.toLowerCase() === currentFilters.region.toLowerCase();
        
        const matchAdvice = !currentFilters.advice || 
            (company.advice && company.advice.toLowerCase().includes(currentFilters.advice.toLowerCase()));
        
        const matchSearch = !currentFilters.searchText || 
            company.name?.toLowerCase().includes(currentFilters.searchText);

        return matchRegion && matchAdvice && matchSearch;
    });

    currentPage = 1;
    displayResults(filteredResults);
} 