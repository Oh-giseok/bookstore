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