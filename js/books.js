// 카카오 이미지 URL에서 모든 저해상도 파라미터를 고해상도로 바꿔주는 함수
function getHighResThumbnail(url) {
    if (!url) return '';

    // 1. URL 디코딩을 진행하여 내부 원본 이미지 URL 추출 가능하게 준비
    let decodedUrl = decodeURIComponent(url);

    // 2. 카카오 CDN의 대표적인 섬네일 사이즈 규격들(R120x0, C120x174 등)을 R500x0(고해상도)으로 일괄 변경
    let highResUrl = decodedUrl
        .replace(/R120x0/g, 'R500x0')
        .replace(/C120x174/g, 'R500x0')
        .replace(/C114x164/g, 'R500x0');

    // 3. 만약 fname= 파라미터 방식이라면 원본 이미지 URL만 직접 추출하여 고해상도 요청
    if (highResUrl.includes('fname=')) {
        const originUrl = highResUrl.split('fname=')[1];
        if (originUrl) {
            return `https://search1.kakaocdn.net/thumb/R500x0/?fname=${encodeURIComponent(originUrl)}`;
        }
    }

    return highResUrl;
}

// API 호출 함수
async function fetchBooks(query, size = 1, target = "title") {
    const params = new URLSearchParams({
        target: target,
        query: query,
        size: size
    });
    const url = `https://dapi.kakao.com/v3/search/book?${params}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: "KakaoAK 7d039ae9daaba0a07ec359851c2a47c1"
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
    }

    return response.json();
}

// ------------------------------------------------------------------
// [Section 1] - 원하는 책 배열에 넣어서 노출시키기
// ------------------------------------------------------------------
async function initSection1() {
    const bookTitles = [        
        "개발자", "프론트엔드", "백엔드", "풀스택", "자바스크립트", "파이썬",
        "AI", "클로드", "chat gpt", "비주얼 스튜디오", "닷넷"        
    ];

    const swiperWrapper = document.querySelector('.section-1 .swiper-wrapper, #section-1 .swiper-wrapper');
    if (!swiperWrapper) return;

    let slidesHTML = '';

    for (const title of bookTitles) {
        try {
            const data = await fetchBooks(title, 1);
            if (data.documents && data.documents[0]) {
                const doc = data.documents[0];
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);
                const detailUrl = `detail.html?title=${encodeURIComponent(doc.title)}`;

                // 랜덤 평점 및 리뷰 수 생성
                const randomRating = (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1);
                const randomReviews = Math.floor(Math.random() * 20) + 1;

                slidesHTML += `
                    <div class="swiper-slide product-item">
                        <a href="${detailUrl}" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">        
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${detailUrl}">${doc.title}</a></div>
                            <div class="book-author"><a href="${detailUrl}">${doc.authors ? doc.authors.join(', ') : ''}</a></div>
                            <div class="book-rating">
                                <span class="star">★</span>${randomRating} <span class="review-count">(${randomReviews})</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
        }
    }

    swiperWrapper.innerHTML = slidesHTML;

    new Swiper(swiperWrapper.closest('.swiper'), {
        slidesPerView: 6,
        spaceBetween: 12,
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.section-1 .swiper-button-next, #section-1 .swiper-button-next',
            prevEl: '.section-1 .swiper-button-prev, #section-1 .swiper-button-prev',
        }
    });
}

// ------------------------------------------------------------------
// [Section 2] - 슬라이드 내부 ul > li 구조 (3개 슬라이드)
// ------------------------------------------------------------------
async function initSection2() {
    const swiperWrapper = document.querySelector('.section-2 .swiper-wrapper, #section-2 .swiper-wrapper');
    if (!swiperWrapper) return;

    let slidesHTML = '';

    try {
        const data = await fetchBooks("개발", 27); 
        
        if (data.documents && data.documents.length > 0) {
            const booksPerPage = 9;
            const totalSlides = Math.ceil(data.documents.length / booksPerPage);

            for (let page = 0; page < totalSlides; page++) {
                const pageBooks = data.documents.slice(page * booksPerPage, (page + 1) * booksPerPage);
                
                let listItemsHTML = '';
                pageBooks.forEach((doc, idx) => {
                    const rank = page * booksPerPage + idx + 1;
                    const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                    // 랜덤 평점 및 리뷰 수 생성
                    const randomRating = (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1);
                    const randomReviews = Math.floor(Math.random() * 20) + 1;

                    listItemsHTML += `
                        <li class="product-item-horizontal">
                            <a href="${doc.url}" target="_blank" class="ridi-book-link">
                                <img src="${bigThumbnail}" alt="${doc.title}">
                            </a>
                            <div class="num">${rank}</div>
                            <div class="book-info">
                                <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                                <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>
                                <div class="book-rating">
                                    <span class="star">★</span>${randomRating} <span class="review-count">(${randomReviews})</span>
                                </div>
                            </div>
                        </li>
                    `;
                });

                slidesHTML += `
                    <li class="swiper-slide">
                        <ul class="book-grid-list">
                            ${listItemsHTML}
                        </ul>
                    </li>
                `;
            }
        }
    } catch (err) {
        console.error("section-2 로드 오류:", err);
    }

    swiperWrapper.innerHTML = slidesHTML;

    new Swiper(swiperWrapper.closest('.swiper'), {
        slidesPerView: 1,
        spaceBetween: 20,
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.section-2 .swiper-button-next, #section-2 .swiper-button-next',
            prevEl: '.section-2 .swiper-button-prev, #section-2 .swiper-button-prev',
        }
    });
}

// ------------------------------------------------------------------
// [Section 4] - 조앤.K.롤링 작가 도서 전용
// ------------------------------------------------------------------
async function initSection4() {
    const authorName = "조앤.K.롤링";
    const swiperWrapper4 = document.querySelector('#section-4 .swiper-wrapper, .section-4 .swiper-wrapper');
    
    if (!swiperWrapper4) return;

    try {
        const data = await fetchBooks(authorName, 10, "person");

        if (data.documents && data.documents.length > 0) {
            let slidesHTML4 = '';

            data.documents.forEach((doc) => {
                if (!doc.thumbnail) return;
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                // 랜덤 평점 및 리뷰 수 생성
                const randomRating = (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1);
                const randomReviews = Math.floor(Math.random() * 20) + 1;

                slidesHTML4 += `
                    <div class="swiper-slide product-item">
                        <a href="${doc.url}" target="_blank" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                            <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>
                            <div class="book-rating">
                                <span class="star">★</span>${randomRating} <span class="review-count">(${randomReviews})</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            swiperWrapper4.innerHTML = slidesHTML4;

            new Swiper(swiperWrapper4.closest('.swiper'), {
                slidesPerView: 6,
                spaceBetween: 12,
                observer: true,
                observeParents: true,
                navigation: {
                    nextEl: '.section-4 .swiper-button-next, #section-4 .swiper-button-next',
                    prevEl: '.section-4 .swiper-button-prev, #section-4 .swiper-button-prev',
                }
            });
        }
    } catch (err) {
        console.error("section-4 데이터 로드 중 오류 발생:", err);
    }
}

// ------------------------------------------------------------------
// [Section 6] - 김애란 작가 도서 전용
// ------------------------------------------------------------------
async function initSection6() {
    const authorName = "김애란";
    const swiperWrapper6 = document.querySelector('#section-6 .swiper-wrapper, .section-6 .swiper-wrapper');
    
    if (!swiperWrapper6) return;

    try {
        const data = await fetchBooks(authorName, 10, "person");

        if (data.documents && data.documents.length > 0) {
            let slidesHTML6 = '';

            data.documents.forEach((doc) => {
                if (!doc.thumbnail) return;
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                // 랜덤 평점 및 리뷰 수 생성
                const randomRating = (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1);
                const randomReviews = Math.floor(Math.random() * 20) + 1;

                slidesHTML6 += `
                    <div class="swiper-slide product-item">
                        <a href="${doc.url}" target="_blank" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">        
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                            <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>                        
                            <div class="book-rating">
                                <span class="star">★</span>${randomRating} <span class="review-count">(${randomReviews})</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            swiperWrapper6.innerHTML = slidesHTML6;

            new Swiper(swiperWrapper6.closest('.swiper'), {
                slidesPerView: 6,
                spaceBetween: 12,                    
                observer: true,
                observeParents: true,
                navigation: {
                    nextEl: '.section-6 .swiper-button-next, #section-6 .swiper-button-next',
                    prevEl: '.section-6 .swiper-button-prev, #section-6 .swiper-button-prev',
                }
            });
        }
    } catch (err) {
        console.error("section-6 데이터 로드 중 오류 발생:", err);
    }
}

// ------------------------------------------------------------------
// [Section 7] - 매들린 밀러 작가 도서 전용
// ------------------------------------------------------------------
async function initSection7() {
    const authorName = "매들린 밀러";
    const swiperWrapper7 = document.querySelector('#section-7 .swiper-wrapper, .section-7 .swiper-wrapper');
    
    if (!swiperWrapper7) return;

    try {
        const data = await fetchBooks(authorName, 10, "person");

        if (data.documents && data.documents.length > 0) {
            let slidesHTML7 = '';

            data.documents.forEach((doc) => {
                if (!doc.thumbnail) return;
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                // 랜덤 평점 및 리뷰 수 생성
                const randomRating = (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1);
                const randomReviews = Math.floor(Math.random() * 20) + 1;

                slidesHTML7 += `
                    <div class="swiper-slide product-item">
                        <a href="${doc.url}" target="_blank" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">        
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                            <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>                        
                            <div class="book-rating">
                                <span class="star">★</span>${randomRating} <span class="review-count">(${randomReviews})</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            swiperWrapper7.innerHTML = slidesHTML7;

            new Swiper(swiperWrapper7.closest('.swiper'), {
                slidesPerView: 6,
                spaceBetween: 12,                    
                observer: true,
                observeParents: true,
                navigation: {
                    nextEl: '.section-7 .swiper-button-next, #section-7 .swiper-button-next',
                    prevEl: '.section-7 .swiper-button-prev, #section-7 .swiper-button-prev',
                }
            });
        }
    } catch (err) {
        console.error("section-7 데이터 로드 중 오류 발생:", err);
    }
}

// ------------------------------------------------------------------
// [Section 9] - 지정 도서 전용
// ------------------------------------------------------------------
async function initSection9() {
    const bookTitles = [
        "주식의 시대", "돈의 권력", "AI 시대의 플랫폼 비즈니스", "읽고 쓰고 소유하다",
        "새로운 부의 시대", "개정판 | 소상공인을 위한 빅데이터 상권분석", "금에 투자하라", "정해진 미래 시장의 기회"
    ];

    const swiperWrapper = document.querySelector('.section-9 .swiper-wrapper, #section-9 .swiper-wrapper');
    if (!swiperWrapper) return;

    let slidesHTML = '';

    for (const title of bookTitles) {
        try {
            const data = await fetchBooks(title, 1);
            if (data.documents && data.documents[0]) {
                const doc = data.documents[0];
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                // 랜덤 평점 및 리뷰 수 생성
                const randomRating = (Math.random() * (5.0 - 3.0) + 3.0).toFixed(1);
                const randomReviews = Math.floor(Math.random() * 20) + 1;

                slidesHTML += `
                    <div class="swiper-slide product-item">
                        <a href="${doc.url}" target="_blank" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">        
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                            <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>                        
                            <div class="book-rating">
                                <span class="star">★</span>${randomRating} <span class="review-count">(${randomReviews})</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
        }
    }

    swiperWrapper.innerHTML = slidesHTML;

    new Swiper(swiperWrapper.closest('.swiper'), {
        slidesPerView: 6,
        spaceBetween: 12,
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.section-9 .swiper-button-next',
            prevEl: '.section-9 .swiper-button-prev',
        }
    });
}

// DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {
    initSection1();
    initSection2();
    initSection4();
    initSection6();
    initSection7();    
    initSection9();
});