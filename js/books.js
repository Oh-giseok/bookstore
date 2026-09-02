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
async function fetchBooks(query) {
    const params = new URLSearchParams({
        target: "title",
        query,
        size: 1
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

async function bookData() {
    try {
        const bookTitles = [
            "주식의 시대",
            "돈의 권력",
            "AI 시대의 플랫폼 비즈니스",
            "읽고 쓰고 소유하다",
            "새로운 부의 시대",
            "개정판 | 소상공인을 위한 빅데이터 상권분석",
            "금에 투자하라",
            "정해진 미래 시장의 기회"
        ];

        const section = document.querySelector('#section-1');
        if (!section) return;
        
        const swiperWrapper = section.querySelector('.swiper-wrapper');
        if (!swiperWrapper) return;
        
        let slidesHTML = '';

        for (const title of bookTitles) {
            const data = await fetchBooks(title);
            const doc = data.documents[0];

            if (!doc || !doc.thumbnail) continue;

            // 🌟 카카오 썸네일 주소를 R500x0 고해상도로 완벽 전환
            const bigThumbnail = getHighResThumbnail(doc.thumbnail);

            slidesHTML += `
                <div class="swiper-slide">
                    <a href="${doc.url}" target="_blank" class="ridi-book-link">
                        <img src="${bigThumbnail}" alt="${doc.title}">        
                    </a>
                    <div class="book-info">
                        <h3>${doc.title}</h3>
                        <h6>${doc.authors.join(', ')}</h6>        
                        <button type="button">click</button>
                    </div>
                </div>
            `;
        }

        swiperWrapper.innerHTML = slidesHTML;

        new Swiper('#section-1 .swiper', {
            slidesPerView: 6,
            spaceBetween: 12,
            navigation: {
                nextEl: '#section-1 .swiper-button-next',
                prevEl: '#section-1 .swiper-button-prev',
            },
        });

    } catch (error) {
        console.log('에러발생', error);
    }
}

bookData();