// 카카오 API 인증키
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

// 같은 작가의 다른 작품 (Swiper 슬라이더) 불러오기
async function loadAuthorBooks(authorName, currentBookTitle) {
    if (!authorName) return;

    try {
        const params = new URLSearchParams({
            target: 'person',
            query: authorName,
            size: 20 // 중복 제거를 고려해 검색 개수를 조금 늘려줍니다.
        });

        const response = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
            method: 'GET',
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        
        const tabWrapper = document.querySelector('.author-books-wrapper');
        const recentWrapper = document.querySelector('.recent-books-wrapper');
        const authorText = document.querySelector('.author-name-text');

        if (authorText) authorText.textContent = authorName;

        if (data.documents) {
            // 1. 현재 보고 있는 책 제외
            const filteredBooks = data.documents.filter(book => book.title !== currentBookTitle);

            // 2. 제목 기준 중복 제거 (Map을 활용하여 이미 존재하는 제목은 건너뜀)
            const uniqueBooksMap = new Map();
            filteredBooks.forEach(book => {
                const cleanTitle = book.title.trim();
                if (!uniqueBooksMap.has(cleanTitle)) {
                    uniqueBooksMap.set(cleanTitle, book);
                }
            });

            // 중복이 제거된 책 배열
            const otherBooks = Array.from(uniqueBooksMap.values());

            if (otherBooks.length === 0) {
                const emptyHTML = '<div class="swiper-slide"><p>작가의 다른 작품이 없습니다.</p></div>';
                if (tabWrapper) tabWrapper.innerHTML = emptyHTML;
                if (recentWrapper) recentWrapper.innerHTML = emptyHTML;
    
                document.querySelectorAll('.author-book-swiper .swiper-button-next, .author-book-swiper .swiper-button-prev, .swiper-section .swiper-button-next, .swiper-section .swiper-button-prev').forEach(btn => {
                    btn.style.display = 'none';
                });

                return;
            }

            // HTML 슬라이드 생성
            const slidesHTML = otherBooks.map(book => {
                const img = book.thumbnail || 'https://via.placeholder.com/120x170?text=No+Image';
                const price = book.sale_price ? `${book.sale_price.toLocaleString()}원` : (book.price ? `${book.price.toLocaleString()}원` : '가격 없음');

                return `
                    <div class="swiper-slide">
                        <a href="detail.html?title=${encodeURIComponent(book.title)}" class="book-card">
                            <div class="img-box">
                                <img src="${img}" alt="${book.title}" />
                            </div>
                            <div class="book-info">
                                <p class="book-title">${book.title}</p>
                                <p class="book-price">${price}</p>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');

            // 탭 패널 및 하단 Swiper에 주입
            if (tabWrapper) tabWrapper.innerHTML = slidesHTML;
            if (recentWrapper) recentWrapper.innerHTML = slidesHTML;

            // Swiper 초기화
            initSwiper();
        }
    } catch (err) {
        console.error('작가의 다른 작품 로드 오류:', err);
    }
}

// Swiper 초기화 함수
function initSwiper() {
    // 2번째 탭 메뉴 내 Swiper
    new Swiper('.author-book-swiper', {
        slidesPerView: 2,
        spaceBetween: 12,
        navigation: {
            nextEl: '.author-book-swiper .swiper-button-next',
            prevEl: '.author-book-swiper .swiper-button-prev',
        },
        pagination: {
            el: '.author-book-swiper .swiper-pagination',
            clickable: true,
        },
        breakpoints: {
            640: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 6, spaceBetween: 20 },
        }
    });

    // 하단 recent-books Swiper
    new Swiper('.author-bottom-swiper', {
        slidesPerView: 2,
        spaceBetween: 12,
        navigation: {
            nextEl: '.swiper-section .swiper-button-next',
            prevEl: '.swiper-section .swiper-button-prev',
        },
        breakpoints: {
            640: { slidesPerView: 4, spaceBetween: 20 },
            1024: { slidesPerView: 6, spaceBetween: 20 },
        }
    });
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
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` }
        });

        if (!response.ok) throw new Error(`HTTP 오류: ${response.status}`);

        const data = await response.json();

        if (data.documents && data.documents[0]) {
            const book = data.documents[0];
            const bigThumbnail = getHighResThumbnail(book.thumbnail);

            // 문서 타이틀 및 헤더 설정
            document.title = `${book.title} - 도서 상세`;

            // 이미지
            const detailImg = document.querySelector('.detail-img');
            if (detailImg) {
                detailImg.src = bigThumbnail;
                detailImg.alt = book.title;
            }

            // 모든 detail-title 클래스 요소에 제목 입력
            const detailTitles = document.querySelectorAll('.detail-title');
            detailTitles.forEach(el => { el.textContent = book.title; });

            // 저자
            const detailAuthor = document.querySelector('.detail-author');
            if (detailAuthor) detailAuthor.textContent = book.authors ? book.authors.join(', ') : '저자 정보 없음';

            // 출판사
            const detailPublisher = document.querySelector('.detail-publisher');
            if (detailPublisher) detailPublisher.textContent = book.publisher || '출판사 정보 없음';

            // 가격 및 할인가
            const detailPrice = document.querySelector('.detail-price');
            if (detailPrice) detailPrice.textContent = book.price ? `${book.price.toLocaleString()}원` : '0원';

            const detailSalePrice = document.querySelector('.detail-sale-price');            
            if (detailSalePrice) {
                if (book.sale_price) {
                    const discount = Math.round(((book.price - book.sale_price) / book.price) * 100);
                    detailSalePrice.innerHTML = `<strong>${discount}%↓</strong> ${book.sale_price.toLocaleString()}원`;
                } else {
                    detailSalePrice.textContent = '0원';
                }
            }
            
            // 1번째 탭(작품 소개) 내용 주입
            const detailContents = document.querySelector('.detail-contents');
            if (detailContents) {
                detailContents.textContent = book.contents ? `${book.contents}...` : '상세 소개글이 없습니다.';
            }

            // 배경 색상
            const bgElement = document.querySelector('.detail-bg');
            if (bgElement) bgElement.style.backgroundColor = getColorFromUrl(bigThumbnail);

            // 작가의 다른 작품 불러오기
            const firstAuthor = book.authors && book.authors.length > 0 ? book.authors[0] : '';
            if (firstAuthor) {
                loadAuthorBooks(firstAuthor, book.title);
            }
        } else {
            alert('책 정보를 찾을 수 없습니다.');
        }
    } catch (err) {
        console.error("상세페이지 로드 오류:", err);
    }
}

// 탭 메뉴 전환 기능
function initTabMenu() {
    const tabLinks = document.querySelectorAll('.tab-menu li a');
    const tabList = document.querySelectorAll('.tab-menu li');
    const tabPanels = document.querySelectorAll('.tab-panel');    

    if (tabList[0]) tabList[0].classList.add('active');
    if (tabPanels[0]) tabPanels[0].classList.add('active');

    tabLinks.forEach((link, index) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            tabList.forEach(item => item.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            if (tabList[index]) tabList[index].classList.add('active');
            if (tabPanels[index]) tabPanels[index].classList.add('active');

            // 탭 변경 시 Swiper 레이아웃 재계산 (숨겨져 있던 Swiper 깨짐 방지)
            const activeSwiper = tabPanels[index].querySelector('.swiper');
            if (activeSwiper && activeSwiper.swiper) {  
                activeSwiper.swiper.update();
            }
        });
    });
}

// 별점 평가 기능 (추가된 함수) 👈 [새로 추가된 로직]
function initStarRating() {
    const starContainer = document.querySelector('.interactive-stars');
    const starInputs = document.querySelectorAll('.interactive-stars .star-input');
    
    if (!starInputs.length) return; // 페이지 내 별점 요소가 없으면 종료

    let selectedRating = 0; // 선택한 별점 저장 (1 ~ 5)

    // 별 색상 업데이트 함수
    function renderStars(targetIndex) {
        starInputs.forEach((star, idx) => {
            if (idx <= targetIndex) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // 각 별점에 이벤트 바인딩
    starInputs.forEach((star, index) => {
        // 마우스 호버 시
        star.addEventListener('mouseenter', () => {
            renderStars(index);
        });

        // 클릭 시 별점 고정
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            renderStars(index);
        });
    });

    // 마우스가 별점 박스 전체에서 벗어났을 때
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            if (selectedRating > 0) {
                renderStars(selectedRating - 1);
            } else {
                starInputs.forEach(star => star.classList.remove('active'));
            }
        });
    }
}

// 이벤트 등록
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();       
    initDetailPage();   
    initTabMenu();    
    initStarRating(); // 별점 기능 초기화 추가 👈 [추가됨]
});