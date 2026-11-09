const btf = {
  debounce: function (func, wait, immediate) {
    let timeout
    return function () {
      const context = this
      const args = arguments
      const later = function () {
        timeout = null
        if (!immediate) func.apply(context, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(context, args)
    }
  },

  throttle: function (func, wait, options) {
    let timeout, context, args
    let previous = 0
    if (!options) options = {}

    const later = function () {
      previous = options.leading === false ? 0 : new Date().getTime()
      timeout = null
      func.apply(context, args)
      if (!timeout) context = args = null
    }

    const throttled = function () {
      const now = new Date().getTime()
      if (!previous && options.leading === false) previous = now
      const remaining = wait - (now - previous)
      context = this
      args = arguments
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        previous = now
        func.apply(context, args)
        if (!timeout) context = args = null
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining)
      }
    }

    return throttled
  },

  sidebarPaddingR: () => {
    const innerWidth = window.innerWidth
    const clientWidth = document.body.clientWidth
    const paddingRight = innerWidth - clientWidth
    if (innerWidth !== clientWidth) {
      document.body.style.paddingRight = paddingRight + 'px'
    }
  },

  snackbarShow: (text, showAction = false, duration = 2000) => {
    const { position, bgLight, bgDark } = GLOBAL_CONFIG.Snackbar
    const bg = document.documentElement.getAttribute('data-theme') === 'light' ? bgLight : bgDark
    Snackbar.show({
      text: text,
      backgroundColor: bg,
      showAction: showAction,
      duration: duration,
      pos: position,
      customClass: 'snackbar-css'
    })
  },

  diffDate: (d, more = false) => {
    const dateNow = new Date()
    const datePost = new Date(d)
    const dateDiff = dateNow.getTime() - datePost.getTime()
    const minute = 1000 * 60
    const hour = minute * 60
    const day = hour * 24
    const month = day * 30

    let result
    if (more) {
      const monthCount = dateDiff / month
      const dayCount = dateDiff / day
      const hourCount = dateDiff / hour
      const minuteCount = dateDiff / minute

      if (monthCount > 12) {
        result = datePost.toISOString().slice(0,10)
      } else if (monthCount >= 1) {
        result = parseInt(monthCount) + ' ' + GLOBAL_CONFIG.date_suffix.month
      } else if (dayCount >= 1) {
        result = parseInt(dayCount) + ' ' + GLOBAL_CONFIG.date_suffix.day
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + ' ' + GLOBAL_CONFIG.date_suffix.hour
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + ' ' + GLOBAL_CONFIG.date_suffix.min
      } else {
        result = GLOBAL_CONFIG.date_suffix.just
      }
    } else {
      result = parseInt(dateDiff / day)
    }
    return result
  },

  loadComment: (dom, callback) => {
    if ('IntersectionObserver' in window) {
      const observerItem = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          callback()
          observerItem.disconnect()
        }
      }, { threshold: [0] })
      observerItem.observe(dom)
    } else {
      callback()
    }
  },

  scrollToDest: (pos, time = 500) => {
    const currentPos = window.pageYOffset
    if (currentPos > pos) pos = pos - 70

    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: pos,
        behavior: 'smooth'
      })
      return
    }

    let start = null
    pos = +pos
    window.requestAnimationFrame(function step (currentTime) {
      start = !start ? currentTime : start
      const progress = currentTime - start
      if (currentPos < pos) {
        window.scrollTo(0, ((pos - currentPos) * progress / time) + currentPos)
      } else {
        window.scrollTo(0, currentPos - ((currentPos - pos) * progress / time))
      }
      if (progress < time) {
        window.requestAnimationFrame(step)
      } else {
        window.scrollTo(0, pos)
      }
    })
  },

  animateIn: (ele, text) => {
    ele.style.display = 'block'
    ele.style.animation = text
  },

  animateOut: (ele, text) => {
    ele.addEventListener('animationend', function f () {
      ele.style.display = ''
      ele.style.animation = ''
      ele.removeEventListener('animationend', f)
    })
    ele.style.animation = text
  },

  getParents: (elem, selector) => {
    for (; elem && elem !== document; elem = elem.parentNode) {
      if (elem.matches(selector)) return elem
    }
    return null
  },

  siblings: (ele, selector) => {
    return [...ele.parentNode.children].filter((child) => {
      if (selector) {
        return child !== ele && child.matches(selector)
      }
      return child !== ele
    })
  },

  /**
   * @param {*} selector
   * @param {*} eleType the type of create element
   * @param {*} options object key: value
   */
  wrap: (selector, eleType, options) => {
    const creatEle = document.createElement(eleType)
    for (const [key, value] of Object.entries(options)) {
      creatEle.setAttribute(key, value)
    }
    selector.parentNode.insertBefore(creatEle, selector)
    creatEle.appendChild(selector)
  },

  unwrap: el => {
    const elParentNode = el.parentNode
    if (elParentNode !== document.body) {
      elParentNode.parentNode.insertBefore(el, elParentNode)
      elParentNode.parentNode.removeChild(elParentNode)
    }
  },

  isHidden: ele => ele.offsetHeight === 0 && ele.offsetWidth === 0,

  getEleTop: ele => {
    let actualTop = ele.offsetTop
    let current = ele.offsetParent

    while (current !== null) {
      actualTop += current.offsetTop
      current = current.offsetParent
    }

    return actualTop
  },

  /**
   * 网址导航页的搜索过滤 + 分类标签
   */
  initLinkFilter: () => {
    const $flink = document.querySelector('#article-container .flink')
    if (!$flink) return

    const $search = $flink.querySelector('.flink-search-input')
    if (!$search) return
    if ($flink.dataset.flinkFilterReady === 'true') return
    $flink.dataset.flinkFilterReady = 'true'

    const $searchBox = $search.closest('.flink-search')
    const $clear = $flink.querySelector('.flink-search-clear')
    const $tags = [...$flink.querySelectorAll('.flink-tag')]
    const $groups = [...$flink.querySelectorAll('.flink-group')]
    const $empty = $flink.querySelector('.flink-empty')

    // 预先缓存每张卡片和每个分类的可搜索文本
    $groups.forEach(group => {
      group.flinkCards = [...group.querySelectorAll('.flink-list-item')]
      group.flinkCards.forEach(card => {
        card.flinkText = card.textContent.replace(/\s+/g, ' ').toLowerCase()
      })
      const $heading = group.querySelector('.flink-name')
      group.flinkName = $heading ? $heading.textContent.replace(/\s+/g, ' ').toLowerCase().trim() : ''
    })

    let activeTag = 'all'

    const applyFilter = () => {
      const keyword = $search.value.trim().toLowerCase()
      const isFiltering = keyword !== '' || activeTag !== 'all'
      let total = 0

      $groups.forEach(group => {
        const tagMatched = activeTag === 'all' || group.dataset.flinkId === activeTag
        let visible = 0

        group.flinkCards.forEach(card => {
          const matched = tagMatched && (keyword === '' ||
            card.flinkText.includes(keyword) ||
            group.flinkName.includes(keyword))
          card.classList.toggle('is-hidden', !matched)
          if (matched) visible++
        })

        group.classList.toggle('is-hidden', visible === 0)
        total += visible
      })

      if ($empty) $empty.style.display = total === 0 ? 'block' : 'none'

      // 过滤状态下目录（列的是全部分类）会失真，先隐藏，取消过滤后恢复
      const $toc = document.getElementById('card-toc')
      const $tocBtn = document.getElementById('mobile-toc-button')
      const $layout = document.getElementById('content-inner')
      if ($toc) $toc.classList.toggle('flink-toc-hide', isFiltering)
      if ($tocBtn) $tocBtn.classList.toggle('flink-toc-hide', isFiltering)
      if ($layout) $layout.classList.toggle('flink-filter-mode', isFiltering)
    }

    const debounceFilter = btf.debounce(applyFilter, 150)

    $search.addEventListener('input', () => {
      if ($searchBox) $searchBox.classList.toggle('has-value', $search.value !== '')
      debounceFilter()
    })

    $search.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        $search.value = ''
        if ($searchBox) $searchBox.classList.remove('has-value')
        applyFilter()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        applyFilter()
      }
    })

    if ($clear) {
      $clear.addEventListener('click', () => {
        $search.value = ''
        if ($searchBox) $searchBox.classList.remove('has-value')
        applyFilter()
        $search.focus()
      })
    }

    $tags.forEach(tag => {
      tag.addEventListener('click', () => {
        activeTag = tag.dataset.flinkTarget || 'all'
        $tags.forEach(item => item.classList.toggle('is-active', item === tag))
        applyFilter()
        btf.scrollToDest(Math.max(btf.getEleTop($flink) - 70, 0), 300)
      })
    })

    applyFilter()
  },

  loadLightbox: ele => {
    const service = GLOBAL_CONFIG.lightbox

    if (service === 'mediumZoom') {
      const zoom = mediumZoom(ele)
      zoom.on('open', e => {
        const photoBg = document.documentElement.getAttribute('data-theme') === 'dark' ? '#121212' : '#fff'
        zoom.update({
          background: photoBg
        })
      })
    }

    if (service === 'fancybox') {
      ele.forEach(i => {
        if (i.parentNode.tagName !== 'A') {
          const dataSrc = i.dataset.lazySrc || i.src
          const dataCaption = i.title || i.alt || ''
          btf.wrap(i, 'a', { href: dataSrc, 'data-fancybox': 'gallery', 'data-caption': dataCaption, 'data-thumb': dataSrc })
        }
      })

      if (!window.fancyboxRun) {
        Fancybox.bind('[data-fancybox]', {
          Hash: false,
          Thumbs: {
            autoStart: false
          }
        })
        window.fancyboxRun = true
      }
    }
  },

  initJustifiedGallery: function (selector) {
    selector.forEach(function (i) {
      if (!btf.isHidden(i)) {
        fjGallery(i, {
          itemSelector: '.fj-gallery-item',
          rowHeight: 220,
          gutter: 4,
          onJustify: function () {
            this.$container.style.opacity = '1'
          }
        })
      }
    })
  },

  updateAnchor: (anchor) => {
    if (anchor !== window.location.hash) {
      if (!anchor) anchor = location.pathname
      const title = GLOBAL_CONFIG_SITE.title
      window.history.replaceState({
        url: location.href,
        title: title
      }, title, anchor)
    }
  },

  getScrollPercent: (currentTop,ele) => {
    const docHeight = ele.clientHeight
    const winHeight = document.documentElement.clientHeight
    const headerHeight = ele.offsetTop
    const contentMath = (docHeight > winHeight) ? (docHeight - winHeight) : (document.documentElement.scrollHeight - winHeight)
    const scrollPercent = (currentTop - headerHeight) / (contentMath)
    const scrollPercentRounded = Math.round(scrollPercent * 100)
    const percentage = (scrollPercentRounded > 100) ? 100 : (scrollPercentRounded <= 0) ? 0 : scrollPercentRounded
    return percentage
  }
}
