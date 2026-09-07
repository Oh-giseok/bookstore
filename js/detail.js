// 카카오 API 인증키 (books.js와 동일한 키)
const KAKAO_API_KEY = "7d039ae9daaba0a07ec359851c2a47c1";

// 공통 헤더 불러오기 함수
async function loadHeader() {
    const headerContainer = document.querySelector('.header-container');
    if (!headerContainer) return;

    try {
        const response = await fetch('header.html');
        if (response.ok) {
            headerContainer.innerHTML = await response.text();
        } else {
            console.error('header.html을 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error('헤더 불러오기 오류:', err);
    }
}

// 고해상도 이미지 변환 함수
function getHighResThumbnail(url) {
    if (!url) return '';
    let decodedUrl = decodeURIComponent(url);
    let highResUrl = decodedUrl
        .replace(/R120x0/g, 'R500x0')
        .replace(/C120x174/g, 'R500x0')
        .replace(/C114x164/g, 'R500x0');

    if (highResUrl.includes('fname=')) {
        const originUrl = highResUrl.split('fname=')[1];
        if (originUrl) {
            return `https://search1.kakaocdn.net/thumb/R500x0/?fname=${encodeURIComponent(originUrl)}`;
        }
    }
    return highResUrl;
}

// URL 기반 고유 배경색 자동 생성 함수
function getColorFromUrl(url) {
    if (!url) return 'hsl(0, 0%, 20%)';
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = url.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 35%, 20%)`;
}

// URL에서 title 파라미터 값 가져오기
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 상세페이지 데이터 로드
async function initDetailPage() {
    const bookTitle = getQueryParam('title');

    if (!bookTitle) {
        alert('잘못된 접근입니다. 메인 페이지로 이동합니다.');
        location.href = 'index.html';
        return;
    }

    try {
        const params = new URLSearchParams({
            target: 'title',
            query: bookTitle,
            size: 1
        });

        const response = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
            method: 'GET',
            headers: {
                Authorization: `KakaoAK ${KAKAO_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP 오류: ${response.status}`);
        }

        const data = await response.json();

        if (data.documents && data.documents[0]) {
            const book = data.documents[0];
            const bigThumbnail = getHighResThumbnail(book.thumbnail);

            // 화면 요소 업데이트 (querySelector 활용)
            document.title = `${book.title} - 도서 상세`;
            
            const detailImg = document.querySelector('.detail-img');
            if (detailImg) {
                detailImg.src = bigThumbnail;
                detailImg.alt = book.title;
            }

            const detailTitle = document.querySelector('.detail-title');
            if (detailTitle) detailTitle.textContent = book.title;

            const detailAuthor = document.querySelector('.detail-author');
            if (detailAuthor) detailAuthor.textContent = book.authors ? book.authors.join(', ') : '저자 정보 없음';

            const detailPublisher = document.querySelector('.detail-publisher');
            if (detailPublisher) detailPublisher.textContent = book.publisher || '출판사 정보 없음';

            const detailPrice = document.querySelector('.detail-price');
            if (detailPrice) detailPrice.textContent = book.price ? book.price.toLocaleString() : '0';

            const detailSalePrice = document.querySelector('.detail-sale-price');
            if (detailSalePrice) detailSalePrice.textContent = book.sale_price ? book.sale_price.toLocaleString() : '0';

            const detailContents = document.querySelector('.detail-contents');
            if (detailContents) {
                detailContents.textContent = book.contents ? `${book.contents}...` : '상세 소개글이 없습니다.';
            }

            // 배경에 고유 색상 지정
            const bgElement = document.querySelector('.detail-bg');
            if (bgElement) {
                bgElement.style.backgroundColor = getColorFromUrl(bigThumbnail);
            }
        } else {
            alert('책 정보를 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error("상세페이지 로드 오류:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHeader();       
    initDetailPage();   
});