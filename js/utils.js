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
   * 网址导航页的搜索过滤 + 分类标签 / 左侧手风琴两级菜单
   */
  initLinkFilter: () => {
    const $flink = document.querySelector('#article-container .flink-tabs-layout') || document.querySelector('#article-container .flink')
    if (!$flink) return

    const $search = $flink.querySelector('.flink-search-input')
    if (!$search) return
    if ($flink.dataset.flinkFilterReady === 'true') return
    $flink.dataset.flinkFilterReady = 'true'

    const isAccordion = Boolean($flink.querySelector('.flink-acc-group'))
    const isTabLayout = isAccordion || Boolean($flink.querySelector('.flink-tab-nav'))
    const $searchBox = $search.closest('.flink-search')
    const $clear = $flink.querySelector('.flink-search-clear')
    const $status = $flink.querySelector('.flink-search-status')
    const $accGroups = [...$flink.querySelectorAll('.flink-acc-group')]
    const $accHeaders = [...$flink.querySelectorAll('.flink-acc-header')]
    const $tags = [...$flink.querySelectorAll('.flink-tag')]
    const $groups = [...$flink.querySelectorAll('.flink-group')]
    const $empty = $flink.querySelector('.flink-empty')

    const escapeHTML = str => String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[s]))
    const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const renderHighlight = (text, keyword) => {
      if (!keyword) return escapeHTML(text)
      const re = new RegExp(`(${escapeRegExp(keyword)})`, 'ig')
      return text.split(re).map((part, idx) =>
        idx % 2 === 1 ? `<mark class="flink-hl">${escapeHTML(part)}</mark>` : escapeHTML(part)
      ).join('')
    }

    // 预先缓存每张卡片和每个分类的可搜索文本及原始文案
    $groups.forEach(group => {
      group.flinkCards = [...group.querySelectorAll('.flink-list-item')]
      group.flinkCards.forEach(card => {
        card.flinkNameEl = card.querySelector('.flink-item-name')
        card.flinkDescEl = card.querySelector('.flink-item-desc')
        card.flinkOrigName = card.flinkNameEl ? card.flinkNameEl.textContent : ''
        card.flinkOrigDesc = card.flinkDescEl ? card.flinkDescEl.textContent : ''
        card.flinkHlKey = ''
        card.flinkText = card.textContent.replace(/\s+/g, ' ').toLowerCase()
      })
      const $heading = group.querySelector('.flink-name')
      group.flinkName = $heading ? $heading.textContent.replace(/\s+/g, ' ').toLowerCase().trim() : ''
    })

    const updateCardHighlight = (card, rawKeyword) => {
      const key = rawKeyword.toLowerCase()
      if (card.flinkHlKey === key) return
      card.flinkHlKey = key
      if (card.flinkNameEl) {
        card.flinkNameEl.innerHTML = rawKeyword ? renderHighlight(card.flinkOrigName, rawKeyword) : escapeHTML(card.flinkOrigName)
      }
      if (card.flinkDescEl) {
        card.flinkDescEl.innerHTML = rawKeyword ? renderHighlight(card.flinkOrigDesc, rawKeyword) : escapeHTML(card.flinkOrigDesc)
      }
    }

    const syncHash = val => {
      if (!isTabLayout || !val || !window.history || !window.history.replaceState) return
      try {
        window.history.replaceState(null, '', '#' + encodeURIComponent(val))
      } catch (e) {}
    }

    let activeTag = isTabLayout ? (($tags[0] && $tags[0].dataset.flinkTarget) || '') : 'all'
    let activeGroup = isAccordion ? (($accGroups[0] && $accGroups[0].dataset.flinkGroup) || '') : ''
    const lastSubByGroup = {}

    if (isAccordion) {
      $accGroups.forEach(ag => {
        const gId = ag.dataset.flinkGroup
        const firstSub = ag.querySelector('.flink-acc-sub')
        if (gId && firstSub) lastSubByGroup[gId] = firstSub.dataset.flinkTarget || ''
      })
    }

    const setExpandedGroup = groupId => {
      $accGroups.forEach(ag => {
        const open = ag.dataset.flinkGroup === groupId
        ag.classList.toggle('is-open', open)
        const btn = ag.querySelector('.flink-acc-header')
        if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false')
      })
    }

    // 支持通过 URL hash 直接定位对应一级或二级分类
    if (isTabLayout && window.location.hash) {
      try {
        const hashId = decodeURIComponent(window.location.hash.slice(1))
        if (isAccordion) {
          const matchedSub = $tags.find(t => t.dataset.flinkTarget === hashId)
          if (matchedSub) {
            activeGroup = matchedSub.dataset.flinkGroup || activeGroup
            activeTag = hashId
            lastSubByGroup[activeGroup] = hashId
            setExpandedGroup(activeGroup)
          } else {
            const matchedGroup = $accGroups.find(ag => ag.dataset.flinkGroup === hashId)
            if (matchedGroup) {
              activeGroup = hashId
              activeTag = lastSubByGroup[activeGroup] || ''
              setExpandedGroup(activeGroup)
            }
          }
        } else {
          const matchedTag = $tags.find(tag => tag.dataset.flinkTarget === hashId)
          if (matchedTag) {
            activeTag = hashId
            matchedTag.scrollIntoView({ block: 'nearest' })
          }
        }
      } catch (e) {}
    }

    const syncTagUI = isSearching => {
      $tags.forEach(item => {
        const active = !isSearching && item.dataset.flinkTarget === activeTag
        item.classList.toggle('is-active', active)
        if (isTabLayout) item.setAttribute('aria-selected', active ? 'true' : 'false')
      })
    }

    const applyFilter = () => {
      const rawKeyword = $search.value.trim()
      const keyword = rawKeyword.toLowerCase()
      const isSearching = keyword !== ''
      const isFiltering = isTabLayout || isSearching || activeTag !== 'all'
      let total = 0
      let matchedGroups = 0

      $groups.forEach(group => {
        const tagMatched = isTabLayout
          ? (isSearching || group.dataset.flinkId === activeTag)
          : (activeTag === 'all' || group.dataset.flinkId === activeTag)

        let visible = 0

        group.flinkCards.forEach(card => {
          const matched = tagMatched && (!isSearching ||
            card.flinkText.includes(keyword) ||
            group.flinkName.includes(keyword))
          card.classList.toggle('is-hidden', !matched)
          updateCardHighlight(card, matched && isSearching ? rawKeyword : '')
          if (matched) visible++
        })

        group.classList.toggle('is-hidden', visible === 0)
        if (visible > 0) matchedGroups++
        total += visible
      })

      if (isTabLayout) {
        syncTagUI(isSearching)
        if ($status) {
          if (isSearching) {
            $status.textContent = `搜索“${rawKeyword}”：共找到 ${total} 个站点（${matchedGroups} 个分类）`
            $status.style.display = 'block'
          } else {
            $status.style.display = 'none'
          }
        }
      }

      if ($empty) $empty.style.display = total === 0 ? 'block' : 'none'

      // 切出原本隐藏的卡片时主动触发一次图片懒加载检查
      window.lazyLoadInstance && window.lazyLoadInstance.update()

      // 过滤/Tab 模式下目录（列的是全部分类）会失真，先隐藏，取消过滤后恢复
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

    const scrollIfNeeded = () => {
      const targetTop = Math.max(btf.getEleTop($flink) - 70, 0)
      if (!isTabLayout || window.scrollY > targetTop) {
        btf.scrollToDest(targetTop, 300)
      }
    }

    if (isAccordion) {
      $accHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const gId = header.dataset.flinkGroup || ''
          const $parent = header.closest('.flink-acc-group')
          const wasOpen = Boolean($parent && $parent.classList.contains('is-open'))
          if ($search.value !== '') {
            $search.value = ''
            if ($searchBox) $searchBox.classList.remove('has-value')
          }
          if (wasOpen) {
            if ($parent) $parent.classList.remove('is-open')
            header.setAttribute('aria-expanded', 'false')
            applyFilter()
            return
          }
          setExpandedGroup(gId)
          activeGroup = gId
          activeTag = lastSubByGroup[gId] || activeTag
          syncHash(activeTag)
          applyFilter()
          scrollIfNeeded()
        })
      })
    }

    $tags.forEach(tag => {
      tag.addEventListener('click', () => {
        if (isTabLayout && $search.value !== '') {
          $search.value = ''
          if ($searchBox) $searchBox.classList.remove('has-value')
        }
        activeTag = tag.dataset.flinkTarget || (isTabLayout ? '' : 'all')
        if (isAccordion) {
          activeGroup = tag.dataset.flinkGroup || activeGroup
          lastSubByGroup[activeGroup] = activeTag
          setExpandedGroup(activeGroup)
          syncHash(activeTag)
        } else if (!isTabLayout) {
          $tags.forEach(item => item.classList.toggle('is-active', item === tag))
        } else {
          syncHash(activeTag)
        }
        applyFilter()
        scrollIfNeeded()
      })
    })

    // 全局 "/" 快捷键聚焦搜索框（防 PJAX 重复注册）
    if (!window.__flinkShortcutReady) {
      window.__flinkShortcutReady = true
      document.addEventListener('keydown', e => {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : ''
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return
        const $input = document.querySelector('#article-container .flink .flink-search-input')
        if (!$input) return
        e.preventDefault()
        $input.focus()
        $input.select()
      })
    }

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
