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
async function fetchBooks(query, size=1) {
    const params = new URLSearchParams({
        target: "title",
        query,
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
        "주식의 시대", "돈의 권력", "AI 시대의 플랫폼 비즈니스", "읽고 쓰고 소유하다",
        "새로운 부의 시대", "개정판 | 소상공인을 위한 빅데이터 상권분석", "금에 투자하라", "정해진 미래 시장의 기회"
    ];

    const swiperWrapper = document.querySelector('.section-1 .swiper-wrapper');
    if (!swiperWrapper) return;

    let slidesHTML = '';

    for (const title of bookTitles) {
        try {
            const data = await fetchBooks(title, 1);
            if (data.documents && data.documents[0]) {
                const doc = data.documents[0];
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                // 🌟 함수를 거치지 않고 바로 HTML을 생성합니다.
                slidesHTML += `
                    <div class="swiper-slide product-item">
                        <a href="${doc.url}" target="_blank" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">        
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                            <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>                        
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error(err);
        }
    }

    swiperWrapper.innerHTML = slidesHTML;

    new Swiper('.section-1 .swiper', {
        slidesPerView: 6,
        spaceBetween: 12,
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.section-1 .swiper-button-next',
            prevEl: '.section-1 .swiper-button-prev',
        }
    });
}
initSection1();

// ------------------------------------------------------------------
// [Section 2] - 슬라이드 내부 ul > li 구조 (3개 슬라이드)
// ------------------------------------------------------------------
async function initSection2() {
    const swiperWrapper = document.querySelector('.section-2 .swiper-wrapper');
    if (!swiperWrapper) return;

    let slidesHTML = '';

    try {
        // 총 3개 슬라이드 × 9개 항목 = 27개 데이터 요청
        const data = await fetchBooks("개발", 27); 
        
        if (data.documents && data.documents.length > 0) {
            const booksPerPage = 9; // 슬라이드 1개당 들어갈 책 개수
            const totalSlides = Math.ceil(data.documents.length / booksPerPage);

            for (let page = 0; page < totalSlides; page++) {
                // 해당 페이지에 들어갈 9개 데이터 추출
                const pageBooks = data.documents.slice(page * booksPerPage, (page + 1) * booksPerPage);
                
                let listItemsHTML = '';
                pageBooks.forEach((doc, idx) => {
                    const rank = page * booksPerPage + idx + 1;
                    const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                    listItemsHTML += `
                        <li class="product-item-horizontal">
                            <a href="${doc.url}" target="_blank" class="ridi-book-link">
                                <img src="${bigThumbnail}" alt="${doc.title}">
                            </a>
                            <div class="num">${rank}</div>
                            <div class="book-info">
                                <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                                <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>
                            </div>
                        </li>
                    `;
                });

                // li.swiper-slide 안에 ul 구조 작성
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

    // Swiper 초기화 (한 번에 1개 슬라이드씩 노출)
    new Swiper('.section-2 .swiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.section-2 .swiper-button-next',
            prevEl: '.section-2 .swiper-button-prev',
        }
    });
}

initSection2();

// ------------------------------------------------------------------
// [Section 4] - 특정 작가의 책 상품 나오게 하기
// ------------------------------------------------------------------
async function initSection4() {    
    const authorName = "조앤.K.롤링"; 

    const swiperWrapper = document.querySelector('.section-4 .swiper-wrapper');
    if (!swiperWrapper) return;

    let slidesHTML = '';

    try {
        // 2. 카카오 도서 검색 (작가 이름 검색)
        // target: "person" 옵션을 사용하면 저자/역자 기준으로 검색합니다.
        const params = new URLSearchParams({
            target: "person", 
            query: authorName,
            size: 10 // 불러올 책 개수 (필요에 따라 조절하세요)
        });

        const response = await fetch(`https://dapi.kakao.com/v3/search/book?${params}`, {
            method: 'GET',
            headers: {
                Authorization: "KakaoAK 7d039ae9daaba0a07ec359851c2a47c1"
            }
        });

        if (!response.ok) throw new Error(`HTTP 오류: ${response.status}`);
        
        const data = await response.json();

        // 3. 검색된 작가의 책 목록 반복 처리
        if (data.documents) {
            data.documents.forEach((doc) => {
                if (!doc.thumbnail) return; // 썸네일 없는 책은 제외
                const bigThumbnail = getHighResThumbnail(doc.thumbnail);

                slidesHTML += `
                    <div class="swiper-slide product-item">
                        <a href="${doc.url}" target="_blank" class="ridi-book-link">
                            <img src="${bigThumbnail}" alt="${doc.title}">        
                        </a>
                        <div class="book-info">
                            <div class="book-title"><a href="${doc.url}" target="_blank">${doc.title}</a></div>
                            <div class="book-author"><a href="${doc.url}" target="_blank">${doc.authors ? doc.authors.join(', ') : ''}</a></div>                        
                        </div>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.error("section-4 데이터 로드 중 오류 발생:", err);
    }

    swiperWrapper.innerHTML = slidesHTML;

    // 4. Swiper 초기화
    // (네비게이션 버튼 ID도 #section-4 로 맞춰주었습니다)
    new Swiper('.section-4 .swiper', {
        slidesPerView: 6,
        spaceBetween: 12,
        observer: true,
        observeParents: true,
        navigation: {
            nextEl: '.section-4 .swiper-button-next',
            prevEl: '.section-4 .swiper-button-prev',
        }
    });
}

initSection4();