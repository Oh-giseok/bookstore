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

const input = document.querySelector('.header-search input');
const clearBtn = document.querySelector('.search-clear');

input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'flex' : 'none';
});

clearBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    clearBtn.style.display = 'none';
});
    
const swiper = new Swiper('.main-swiper__container', {
    slidesPerView: 3,
    spaceBetween: 8,
    navigation: {
        nextEl: '.main-swiper__button-next',
        prevEl: '.main-swiper__button-prev',
    },
    pagination: {
        el: '.main-swiper__pagination',
        clickable: true,
    },
});

const swiper2 = new Swiper('.section-5 .__container', {
    slidesPerView: 3,
    spaceBetween: 6,
    observer: true,
    observeParents: true,
    navigation: {
        nextEl: '.section-5 .swiper-button-next',
        prevEl: '.section-5 .swiper-button-prev',
    }
});