(function ($) {
  'use strict';

  // Smooth navigation with fixed header compensation.
  $('a[href^="#"]').on('click', function (e) {
    var target = $($(this).attr('href'));
    if (!target.length) return;
    e.preventDefault();
    $('html, body').animate({ scrollTop: target.offset().top - 70 }, 450);
    if ($('.navbar-toggle').is(':visible')) {
      $('#devfestNav').collapse('hide');
    }
  });

  // Speaker track filter.
  $('.speaker-filters [data-filter]').on('click', function () {
    var filter = $(this).data('filter');
    $('.speaker-filters .btn').removeClass('active');
    $(this).addClass('active');

    if (filter === 'all') {
      $('.speaker-item').stop(true, true).fadeIn(180);
      return;
    }

    $('.speaker-item').each(function () {
      var show = $(this).data('track') === filter;
      $(this).stop(true, true)[show ? 'fadeIn' : 'fadeOut'](180);
    });
  });


  // Preselect the ticket in the registration modal.
  $('.ticket-buy').on('click', function () {
    var ticket = $(this).data('ticket');
    $('#regTicket').val(ticket);
  });

  // Demo submit state: keep the form on-page until a real ticket backend is connected.
  $('#registrationForm').on('submit', function (e) {
    e.preventDefault();
    var ticket = $('#regTicket').val();
    var student = $('#regStudent').is(':checked');
    var message = 'Вы выбрали ' + ticket + (student ? ' со студенческой скидкой 50%.' : '.');
    $(this).find('.registration-hint').text(message + ' Подключите сюда URL/API билетной системы для финальной оплаты.');
  });


  // Speaker/talk details: works from both speaker cards and schedule slots.
  $('.speaker-card[data-talk], .slot[data-talk]').on('click keydown', function (e) {
    if (e.type === 'keydown' && e.which !== 13 && e.which !== 32) return;
    if (e.type === 'keydown') { e.preventDefault(); $(this).trigger('click'); return; }
    var $el = $(this);
    $('#talkSpeaker').text($el.data('speaker'));
    $('#talkRole').text($el.data('role'));
    $('#talkCity').text($el.data('city'));
    $('#talkTitle').text($el.data('talk'));
    $('#talkTrack').text($el.data('track-name'));
    $('#talkDescription').text($el.data('description'));
    $('#talkModalTitle').text($el.data('speaker'));
    var initials = String($el.data('speaker') || '').split(' ').map(function (x) { return x.charAt(0); }).slice(0,2).join('');
    $('#talkAvatar').text(initials || '{ }');
  });


  // Ticket-level promo button: remember which ticket the user came from.
  $('.ticket-promo').on('click', function () {
    var ticket = $(this).data('ticket');
    $('#promoModalTitle').text('Получить промокод · ' + ticket);
  });

  // Full-width gallery: page dots, working arrows, swipe/scroll, and lightbox.
  var $gallery = $('#photoGallery');
  var $strip = $gallery.find('.gallery-strip');
  var $slides = $strip.find('.gallery-slide');
  var galleryPage = 0;
  var lightboxIndex = 0;
  var visibleCount = 3;
  var pageCount = 1;

  function getVisibleCount() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 992) return 2;
    return 3;
  }

  function rebuildGalleryDots() {
    visibleCount = getVisibleCount();
    pageCount = Math.max(1, Math.ceil($slides.length / visibleCount));
    galleryPage = Math.min(galleryPage, pageCount - 1);
    var $dots = $('.gallery-dots').empty();
    for (var i = 0; i < pageCount; i++) {
      $('<button type="button" class="gallery-dot" aria-label="Страница фотографий ' + (i + 1) + '"></button>')
        .appendTo($dots)
        .data('page', i)
        .on('click', function () { scrollGalleryToPage($(this).data('page')); });
    }
    updateGalleryDots();
  }

  function updateGalleryDots() {
    $('.gallery-dot').removeClass('active').eq(galleryPage).addClass('active');
    $('.gallery-prev').prop('disabled', galleryPage <= 0);
    $('.gallery-next').prop('disabled', galleryPage >= pageCount - 1);
  }

  function scrollGalleryToPage(page) {
    galleryPage = Math.max(0, Math.min(page, pageCount - 1));
    var slideIndex = galleryPage * visibleCount;
    var left = $slides.eq(slideIndex).length ? $slides.eq(slideIndex).position().left + $strip.scrollLeft() : 0;
    $strip.stop(true).animate({ scrollLeft: left }, 360);
    updateGalleryDots();
  }

  $('.gallery-next').on('click', function () { scrollGalleryToPage(galleryPage + 1); });
  $('.gallery-prev').on('click', function () { scrollGalleryToPage(galleryPage - 1); });

  var scrollTimer;
  $strip.on('scroll', function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var scrollLeft = $strip.scrollLeft();
      var nearest = 0;
      var nearestDistance = Infinity;
      $slides.each(function (i) {
        var distance = Math.abs($(this).position().left + scrollLeft - scrollLeft);
        var absoluteLeft = this.offsetLeft;
        var d = Math.abs(absoluteLeft - scrollLeft);
        if (d < nearestDistance) { nearestDistance = d; nearest = i; }
      });
      galleryPage = Math.max(0, Math.min(Math.floor(nearest / visibleCount), pageCount - 1));
      updateGalleryDots();
    }, 100);
  });

  function openPhoto(index) {
    lightboxIndex = (index + $slides.length) % $slides.length;
    var $slide = $slides.eq(lightboxIndex);
    $('#photoModalImage').attr('src', $slide.data('full')).attr('alt', $slide.find('img').attr('alt'));
    if (!$('#photoModal').hasClass('in')) $('#photoModal').modal('show');
  }
  $slides.on('click', function () { openPhoto($slides.index(this)); });
  $('.photo-modal-prev').on('click', function () { openPhoto(lightboxIndex - 1); });
  $('.photo-modal-next').on('click', function () { openPhoto(lightboxIndex + 1); });

  $(window).on('resize.gallery', function () {
    var oldVisible = visibleCount;
    var nextVisible = getVisibleCount();
    if (oldVisible !== nextVisible) {
      rebuildGalleryDots();
      scrollGalleryToPage(galleryPage);
    }
  });

  rebuildGalleryDots();

  $('#promoForm').on('submit', function (e) {
    e.preventDefault();
    $(this).find('.registration-hint').text('Заявка заполнена. Подключите реальный endpoint формы, чтобы отправлять данные организаторам.');
  });

  // Venue map: MapLibre + OpenFreeMap.
  // OpenFreeMap works without an API key and lets us keep a fully custom DevFest marker.
  if (window.maplibregl && document.getElementById('devfestMap')) {
    var venueLngLat = [48.033547, 46.354593];

    var venueMap = new maplibregl.Map({
      container: 'devfestMap',
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: venueLngLat,
      zoom: 16.0,
      minZoom: 11,
      maxZoom: 19,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false
    });

    venueMap.scrollZoom.disable();
    venueMap.touchZoomRotate.disableRotation();

    venueMap.addControl(new maplibregl.NavigationControl({
      showCompass: false,
      showZoom: true,
      visualizePitch: false
    }), 'top-right');

    venueMap.addControl(new maplibregl.AttributionControl({
      compact: true,
      customAttribution: 'OpenFreeMap · OpenStreetMap'
    }), 'bottom-right');

    var markerEl = document.createElement('button');
    markerEl.type = 'button';
    markerEl.className = 'devfest-map-marker';
    markerEl.setAttribute('aria-label', 'DevFest Astrakhan 2026, ул. Ульяновых, 4');
    markerEl.innerHTML = '<span class="devfest-map-marker-pin"><b>{ }</b><i></i></span><span class="devfest-map-marker-label">DevFest</span>';

    var popup = new maplibregl.Popup({
      offset: [0, -70],
      closeButton: false,
      className: 'devfest-map-popup'
    }).setHTML('<strong>DevFest Astrakhan 2026</strong><span>21 ноября · «ПЛАТФОРМА»</span>');

    new maplibregl.Marker({
      element: markerEl,
      anchor: 'bottom'
    })
      .setLngLat(venueLngLat)
      .setPopup(popup)
      .addTo(venueMap);

    markerEl.addEventListener('click', function () {
      if (popup.isOpen()) popup.remove();
      else popup.setLngLat(venueLngLat).addTo(venueMap);
    });

    venueMap.on('load', function () {
      venueMap.resize();
    });

    $(window).on('resize.devfestMap', function () {
      venueMap.resize();
    });
  }

  // Slight navbar state change after scrolling.
  $(window).on('scroll', function () {
    $('.navbar-devfest').toggleClass('is-scrolled', $(window).scrollTop() > 20);
  }).trigger('scroll');
})(jQuery);
