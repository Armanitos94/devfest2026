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


  // One data source for cards, timetable slots and the modal.
  // Descriptions are stored only in js/talks-data.js (no duplicated data-* blobs).
  var talks = window.DEVFEST_TALKS || {};
  // Keep visible titles and names consistent with the separate data file.
  // Static HTML remains readable even if JavaScript is disabled.
  $('.speaker-card[data-talk-id]').each(function () {
    var talk = talks[$(this).attr('data-talk-id')];
    if (!talk) return;
    var trackText = talk.track === 'hard' ? 'Hard Skills' : 'Soft Skills';
    $(this).find('h3').text(talk.name);
    $(this).find('p').first().text(talk.role || '');
    $(this).find('small').first().text(talk.city || '');
    $(this).find('.speaker-time-sticker').contents().filter(function(){ return this.nodeType === 3; }).last().replaceWith(' ' + talk.start + ' — ' + talk.end);
    $(this).find('.track').text(trackText)
      .removeClass('track-hard track-soft').addClass('track-' + talk.track);
    $(this).find('.speaker-photo img').attr('src', talk.photo).attr('alt', talk.name);
    $(this).attr('aria-label', 'Подробнее о докладе: ' + talk.name + ' — ' + talk.title);
    $(this).closest('.speaker-item').attr('data-track', talk.track);
  });
  $('.slot[data-talk-id]').each(function () {
    var talk = talks[$(this).attr('data-talk-id')];
    if (!talk) return;
    $(this).find('.schedule-slot-top em').text(talk.track === 'hard' ? 'Hard' : 'Soft');
    $(this).find('.slot-title').text(talk.title);
    $(this).find('.slot-speaker').text(talk.name);
    $(this).find('.slot-role').text(talk.role || '');
    $(this).removeClass('hard soft').addClass(talk.track);
    $(this).attr('aria-label', 'Открыть доклад: ' + talk.name + ' — ' + talk.title);
  });
  $('.speaker-card[data-talk-id], .slot[data-talk-id]').on('keydown', function (e) {
    if (e.which !== 13 && e.which !== 32) return;
    e.preventDefault();
    $(this).trigger('click');
  });

  $('#talkModal').on('show.bs.modal', function (e) {
    var id = e.relatedTarget && $(e.relatedTarget).attr('data-talk-id');
    var talk = talks[id];
    if (!talk) { e.preventDefault(); return; }

    var trackText = talk.track === 'hard' ? 'Hard Skills' : 'Soft Skills';
    $('#talkTrack').text(trackText)
      .removeClass('talk-track-hard talk-track-soft')
      .addClass('talk-track-' + talk.track);
    $('#talkModalTime').text('◷ ' + talk.start + ' — ' + talk.end);
    $('#talkSpeaker').text(talk.name);
    $('#talkRole').text(talk.role || '');
    $('#talkCity').text(talk.city || '');
    $('#talkTitle').text(talk.title);
    $('#talkPhoto').attr('src', talk.photo).attr('alt', 'Фото: ' + talk.name);

    var $description = $('#talkDescription').empty();
    (talk.paragraphs || []).forEach(function (paragraph) {
      $('<p>').text(paragraph).appendTo($description);
    });
  });

  $('#talkModal').on('hidden.bs.modal', function () {
    $('#talkPhoto').attr('src', '').attr('alt', '');
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
