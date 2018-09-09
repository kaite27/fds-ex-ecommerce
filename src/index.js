import axios from 'axios';
import { freemem } from 'os';
import { ALPN_ENABLED, RSA_NO_PADDING } from 'constants';
import { createVerify } from 'crypto';
import { link } from 'fs';

const ecommerceAPI = axios.create({ baseURL: process.env.API_URL })
const rootEl = document.querySelector('.root')
const mainLoadingEl = document.querySelector('.full-box')

// 자주 쓰는 엘리먼트 빼주기 ex) templates.postList 
const templates = {   
  navigation: document.querySelector('#navigation').content,
  mainHeader: document.querySelector('#main-header').content,
  newProducts: document.querySelector('#new-products').content,
  newProductsList: document.querySelector('#new-products-list').content,
  subscribes: document.querySelector('#subscribes').content,
  contactPage: document.querySelector('#contact-us').content,
  productPage: document.querySelector('#product-page').content,
  productPageList: document.querySelector('#product-page-list').content,
  login: document.querySelector('#login').content,
  productDetail: document.querySelector('#product-page-detail').content,
  attributeColor: document.querySelector('#attribute-list-color').content,
  attributeSize: document.querySelector('#attribute-list-size').content,
  reviewList: document.querySelector('#review-list').content,
  cartPage: document.querySelector('#cart-page').content,
  cartPageList: document.querySelector('#cart-page-list').content,
  adminMainPage: document.querySelector('#admin-main-page').content,
  addProductPage: document.querySelector('#add-product-page').content,
  addMoreAttr: document.querySelector('#add-more-variants').content,
  productReviewTab: document.querySelector('#product-review').content,
}

// Avoid code duplication
function render(fragment) {
  // rootEl.textContent = '' 
  rootEl.appendChild(fragment)
}

async function login(token, localUsername) {
  localStorage.setItem('token', token)
  localStorage.setItem('username', localUsername)

  ecommerceAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  rootEl.classList.add('root--authed')

  rootEl.classList.add('root--loading')
  mainLoadingEl.classList.remove('offScreen')
  const res = await ecommerceAPI.get(`/users`)
  rootEl.classList.remove('root--loading')
  mainLoadingEl.classList.add('offScreen')
  
  // localStorage 에 userID 저장하기 
  for(const {username, id} of res.data) {
    if(localStorage.getItem('username') === username) {
      localStorage.setItem('userId', id)
    }
  }
  let count = 0
  const cartRes = await ecommerceAPI.get(`/carts`)
  for(const {userId} of cartRes.data) {
    // if(localStorage.getItem('userId') === userId.toString()) {
      count ++
    }
    localStorage.setItem('cartItem', count)
  // }

  // 강제 1회 리프레시 
  if (self.name != 'reload') {
    self.name = 'reload';
    self.location.reload(true);
  } else self.name = ''; 
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('userId')
  localStorage.removeItem('cartItem')
  // 객체의 속성을 지울 때는 delete
  delete ecommerceAPI.defaults.headers['Authorization']
  rootEl.classList.remove('root--authed')
}

async function nav() {
  const nav = document.importNode(templates.navigation, true)
  const usernameBox = nav.querySelector('.username-box')
  const cartBadge = nav.querySelector('.cart-item__cnt')
  const toAdmin = nav.querySelector('.btn-to-admin')
  const toSignin = nav.querySelector('.btn-sign-in')
  const toShoppingCart = nav.querySelector('.btn-shopping-cart')
  const toSalesReport = nav.querySelector('.btn-sales-report')
  const toLogOut = nav.querySelector('.btn-log-out')
  const toLogIn = nav.querySelector('.btn-log-in')

  if(localStorage.getItem('username') !== null) {
    usernameBox.textContent = (`Welcome ${localStorage.getItem('username')} !`)
    toLogOut.classList.remove('offScreen')
    toLogIn.classList.add('offScreen')
  } 
  if(localStorage.getItem('cartItem') !== null) {
    cartBadge.textContent = (`${localStorage.getItem('cartItem')}`)
  } 
  if(localStorage.getItem('userId') === '1' ){
    toAdmin.classList.remove("offScreen")
    toSignin.classList.add("offScreen")
    toSalesReport.classList.remove("offScreen")
    toShoppingCart.classList.add("offScreen")
  }

  // 홈
  nav.querySelector('.nav-link__btn-home').addEventListener("click", e => {
    rootEl.textContent = '' 
    indexPage();
  })
  // 프로덕트 
  nav.querySelector('.nav-link__btn-product').addEventListener("click", e => { 
    rootEl.textContent = '' 
    productPage('')
  })
  // 카드 아이콘
  nav.querySelector('.cart-icon').addEventListener("click", e => {
    rootEl.textContent = ''
    cartPage()
  })
  // 로그인
  nav.querySelector('.btn-log-in').addEventListener("click", e => {
    rootEl.textContent = ''
    loginPage()
  })
  // 로그아웃
  nav.querySelector('.btn-log-out').addEventListener("click", e => {
    rootEl.textContent = ''
    logout()
    indexPage()
  })
  // 쇼핑 카트
  toShoppingCart.addEventListener("click", e => {
    rootEl.textContent = ''
    cartPage()
  })
  // sign in -> admin
  toAdmin.addEventListener("click", e => {
    rootEl.textContent = ''
    adminPage()
  })
  render(nav)
}

// 이커머스 메인 웹사이트 페이지 
async function indexPage() {
  nav()
  const mainHeader = document.importNode(templates.mainHeader, true)
  const newProFrag = document.importNode(templates.newProducts, true)
  const subscribe = document.importNode(templates.subscribes, true)
  const contactPage = document.importNode(templates.contactPage, true)
  
  rootEl.classList.add('root--loading')
  mainLoadingEl.classList.remove('offScreen')
  const res = await ecommerceAPI.get('/products')
  rootEl.classList.remove('root--loading')
  mainLoadingEl.classList.add('offScreen')

  res.data.forEach(product => {
    const fragment = document.importNode(templates.newProductsList, true)
    const imgEl = fragment.querySelector('.product-page__img--main')
    const viewDetail = fragment.querySelector('.card-link')
    const itemTitle = fragment.querySelector('.new-products-items__title')
    const unitPrice = fragment.querySelector('.list-group-item__unitPrice')
    const marketPrice = fragment.querySelector('.list-group-item__marketPrice')

    itemTitle.textContent = product.productTitle
    unitPrice.textContent = product.unitPrice
    marketPrice.textContent = product.marketPrice
    let url = product.imageURL
    imgEl.setAttribute("src", `${url}`)

    if(product.id === res.data.length || product.id === res.data.length - 1 || product.id === res.data.length - 2 || product.id === res.data.length - 3) {
      newProFrag.querySelector('.new-products-list').appendChild(fragment)
    }

    imgEl.addEventListener("click", e => {
      rootEl.textContent = ''
      productDetailPage(product.id)
    })
    viewDetail.addEventListener("click", e => {
      rootEl.textContent = ''
      productDetailPage(product.id)
    })
  })
  const subscribeEl = subscribe.querySelector('.input-subscribes')
  const subscribeBtnEl = subscribe.querySelector('.send-subscribes')
  subscribeBtnEl.addEventListener("click", e=> {
    const payload = {
      email: subscribeEl.value
    }
    rootEl.classList.add('root--loading')
    mainLoadingEl.classList.remove('offScreen')
    const subRes = ecommerceAPI.post('/subscribes', payload)
    rootEl.classList.remove('root--loading')
    mainLoadingEl.classList.add('offScreen')
  })
  
  render(mainHeader)
  render(newProFrag)
  render(subscribe)
  render(contactPage)
}

// 중복 제거 매소드
function avoid(arr) {
  arr.filter(function(item, i, arr){
    return i == arr.indexOf(item)
  })
}

// 프로덕트 전체 리스트 페이지
async function productPage(currentCat) {
  nav()
  const productPageEl = document.importNode(templates.productPage, true)
  const loadingEl = productPageEl.querySelector('.full-box')
  
  rootEl.classList.add('root--loading')
  loadingEl.classList.remove('offScreen')
  const attRes = await ecommerceAPI.get('/attributes?_expand=product')
  const res = await ecommerceAPI.get(`/products${currentCat}`)
  rootEl.classList.remove('root--loading')
  loadingEl.classList.add('offScreen')
  
  res.data.forEach(product => {
    const fragment = document.importNode(templates.productPageList, true)
    const imgEl = fragment.querySelector('.product-page__img--main')
    const itemTitle = fragment.querySelector('.product-page__title')
    const itemDesc = fragment.querySelector('.product-page__desc')
    const unitPrice = fragment.querySelector('.list-group-item__unitPrice')
    const marketPrice = fragment.querySelector('.list-group-item__marketPrice')
    const colorCnt = fragment.querySelector('.list-group-item__color')
    const sizeCnt = fragment.querySelector('.list-group-item__size')
    const productDetail = fragment.querySelector('.link-to-product-detail')
    const linkBtnEl = fragment.querySelector('.img-box__btn')
    const linkIconEl = fragment.querySelector('.icon-wish')

    itemTitle.textContent = product.productTitle
    itemDesc.textContent = product.productDesc
    unitPrice.textContent = product.unitPrice
    marketPrice.textContent = product.marketPrice
    let url = product.imageURL
    imgEl.setAttribute("src", `${url}`)
    let arrColor = [];
    let arrSize = [];
    
    attRes.data.forEach(attribute => {      
      if(product.id === attribute.productId) {
        arrColor.push(' ' + attribute.color)
        colorCnt.textContent = arrColor.filter(function(item, i, arr){
          return i == arr.indexOf(item)
        })
        arrSize.push(' ' + attribute.size)
        sizeCnt.textContent = arrSize.filter(function(item, i, arr){
          return i == arr.indexOf(item)
        })
      }
    })
    productPageEl.querySelector('.product-page-list').appendChild(fragment)    

    linkBtnEl.addEventListener('click', e => {
      linkIconEl.classList.add('fas-heart')
    })
    
    productDetail.addEventListener("click", e => {
      rootEl.textContent = '' 
      productDetailPage(product.id)
    })
  })
  
  // list category
  const linkAll = productPageEl.querySelector('.list-all')
  const linkDress = productPageEl.querySelector('.list-dress')
  const linkCoat = productPageEl.querySelector('.list-coat')
  const linkShoes = productPageEl.querySelector('.list-shoes')
  const linkBag = productPageEl.querySelector('.list-bags')
  const linkShirts = productPageEl.querySelector('.list-shirts')
  linkAll.addEventListener('click', e => { 
    rootEl.textContent = ''
    productPage('')
  })
  linkDress.addEventListener('click', e => { 
    rootEl.textContent = ''
    productPage(`/?category=dress`)
  })
  linkCoat.addEventListener('click', e => { 
    rootEl.textContent = ''
    productPage(`/?category=coat`)
  })
  linkShoes.addEventListener('click', e => { 
    rootEl.textContent = ''
    productPage(`/?category=shoes`)
  })
  linkBag.addEventListener('click', e => { 
    rootEl.textContent = ''
    productPage(`/?category=bags`)
  })
  linkShirts.addEventListener('click', e => { 
    rootEl.textContent = ''
    productPage(`/?category=shirts`)
  })
  

  render(productPageEl)
}

// 프로덕트 상세 페이지 
async function productDetailPage(productId) {
  nav()
  const fragment = document.importNode(templates.productDetail, true)
  const loadingEl = fragment.querySelector('.full-box')
  
  rootEl.classList.add('root--loading')
  loadingEl.classList.remove('offScreen')
  const res = await ecommerceAPI.get(`/products/${productId}`)
  const attRes = await ecommerceAPI.get('/attributes')
  rootEl.classList.remove('root--loading')
  loadingEl.classList.add('offScreen')

  const productTitle = res.data.productTitle
  const productDesc = res.data.productDesc
  const productImage = res.data.imageURL

  //breadcrumbs
  const breadHomeEl = fragment.querySelector('.breadcrumb-home')
  const breadProductEl = fragment.querySelector('.breadcrumb-product')
  const breadCategoryEl = fragment.querySelector('.breadcrumb-cat')
  const breadSKUEl = fragment.querySelector('.breadcrumb-sku-a')
  // product
  const imgEl = fragment.querySelector('.product-page__img--main-big')  
  const imgEl1 = fragment.querySelector('.img-list-1')  
  const imgEl2 = fragment.querySelector('.img-list-2')  
  const imgEl3 = fragment.querySelector('.img-list-3')  
  const itemTitle = fragment.querySelector('.product-detail-page__title')
  const itemDesc = fragment.querySelector('.product-detail-page__desc')
  let url = res.data.imageURL
  imgEl.setAttribute("src", `${url}`)
  // 가격
  const subTotal = fragment.querySelector('.price-subtotal__value')
  const tax = fragment.querySelector('.price-tax__value')
  const total = fragment.querySelector('.price-total__value')
  let marketPrice = res.data.marketPrice
  // 가격 계산
  const addCartBtn = fragment.querySelector('.btn_submit--cart')  
  const inputEl = fragment.querySelector('.option-quantity')

  // breadcrumb 이동
  breadCategoryEl.textContent = res.data.category
  breadHomeEl.addEventListener('click', e => {
    rootEl.textContent = '' 
    indexPage()  
  })
  breadProductEl.addEventListener('click', e => {
    rootEl.textContent = ''
    productPage('')
  })
  breadCategoryEl.addEventListener('click', e => {
    rootEl.textContent = ''
    productPage(`/?category=${res.data.category}`)
  })
  inputEl.addEventListener("change", e => {
    let itemQtt = inputEl.value
    const taxRate = 0.06875
    let itemPrice = res.data.marketPrice
    let itemSubtotal = itemPrice * parseInt(itemQtt)
    let taxs = taxRate * itemSubtotal
    let totals = itemSubtotal + taxs

    subTotal.textContent = itemSubtotal.toFixed(2)
    tax.textContent = taxs.toFixed(2)
    total.textContent = totals.toFixed(2)
  })

  const selectElColor = fragment.querySelector('.attribute-list-color')
  const selectElSize = fragment.querySelector('.attribute-list-size')
  const AttrRemain = fragment.querySelector('.option-quantity-remain')
  const AttrSKU = fragment.querySelector('.product-detail-page__sku')

  let currentColor = ""
  let currentSize = ""
  // attribute loads
  attRes.data.forEach(attribute => {
    const colorFragment = document.importNode(templates.attributeColor, true)
    const sizeFragment = document.importNode(templates.attributeSize, true)
    
    if(res.data.id === attribute.productId) {
      const optionElColor = colorFragment.querySelector('.attribute-item-color')
      const optionElSize = sizeFragment.querySelector('.attribute-item-size')

      optionElColor.textContent = attribute.color
      optionElSize.textContent = attribute.size

      optionElColor.setAttribute("value", `${attribute.color}`)
      optionElSize.setAttribute("value", `${attribute.size}`)
      optionElColor.setAttribute("selected", "selected")
      optionElSize.setAttribute("selected", "selected")

      // 중복 제거 후 짚어넣기 
      selectElColor.appendChild(colorFragment)
      selectElSize.appendChild(sizeFragment)

      currentColor = attribute.color.toString()
      currentSize = attribute.size.toString()
      AttrRemain.textContent = attribute.quantity
      AttrSKU.textContent = attribute.attrSKU
      breadSKUEl.textContent = attribute.attrSKU

      if(attribute.quantity >= 1) { 
        inputEl.setAttribute("max", `${attribute.quantity}`) 
        addCartBtn.removeAttribute("disabled")   
        addCartBtn.classList.remove("is-static")
      } else {
        inputEl.setAttribute("disabled", "disabled")
        inputEl.value = "0"
        if(inputEl.value = "0") {
          addCartBtn.classList.add("is-static")
        }
      }   
    }
  })

  function attrUpdate() {
    for (const {color, size, quantity, attrSKU} of attRes.data) {
      if(res.data.id === productId) {
        if(currentColor === color && currentSize === size.toString()) {
          AttrRemain.textContent = quantity
          AttrSKU.textContent = attrSKU
          if(quantity == 0) { 
            inputEl.value = "0" 
            inputEl.setAttribute("disabled", "disabled")
            addCartBtn.classList.add("is-static")
          } else {
          inputEl.removeAttribute("disabled")
          addCartBtn.classList.remove("is-static")
          inputEl.value = "1"
          inputEl.setAttribute("max", `${quantity}`)    
          }
          break
        }
        else { 
          AttrRemain.textContent = "no" 
          inputEl.value = "0" 
          inputEl.setAttribute("disabled", "disabled")
          addCartBtn.classList.add("is-static")
        }
      }
    }
  }

  selectElColor.addEventListener("change", e => {
    currentColor = selectElColor.value
    attrUpdate()
  })

  selectElSize.addEventListener("change", e => {
    currentSize = selectElSize.value
    attrUpdate()
  })
  
  itemTitle.textContent = res.data.productTitle
  itemDesc.textContent = res.data.productDesc
  subTotal.textContent = res.data.marketPrice.toFixed(2)
  tax.textContent = ((res.data.marketPrice) * 0.06875).toFixed(2)
  total.textContent = (res.data.marketPrice * ( 0.06875 + 1 )).toFixed(2)

  // modal pop-up
  const modalTitle = fragment.querySelector('.modal-title-item')
  const modalPrice = fragment.querySelector('.modal-price')
  const modalColor = fragment.querySelector('.modal-color')
  const modalSize = fragment.querySelector('.modal-size')
  const modalQtt = fragment.querySelector('.modal-quantity')
  const modalImg = fragment.querySelector('.modal-img')
  const modalCart = fragment.querySelector('.modal-cart')

  // 카트에 담기 
  async function addToCart() {
    attRes.data.forEach(async attr => {
      if (attr.productId === productId) {
        if (selectElColor.value === attr.color && (selectElSize.value).toString() === attr.size.toString()) {

          const payload = {
            productTitle: productTitle,
            productId: productId,
            userId: parseInt(`${localStorage.getItem('userId')}`),
            productDesc: productDesc,
            size: parseInt(selectElSize.value),
            color: selectElColor.value,
            quantity: parseInt(inputEl.value),
            marketPrice: marketPrice,
            subtotalPrice: parseFloat(subTotal.textContent),
            attributeId: attr.id,
            imageURL: productImage
          }
          modalTitle.textContent = itemTitle.textContent
          modalPrice.textContent = parseFloat(subTotal.textContent)
          modalColor.textContent = selectElColor.value
          modalSize.textContent = parseInt(selectElSize.value)
          modalQtt.textContent = parseInt(inputEl.value)
          modalImg.setAttribute("src", `${productImage}`)

          addCartBtn.classList.add('is-loading')
          const res = await ecommerceAPI.post(`/carts`, payload)
          addCartBtn.classList.remove('is-loading')
        }
      }
    })
  }

  addCartBtn.addEventListener("click", async e => {
    e.preventDefault()
    addToCart()
  })

  modalCart.addEventListener('click', e =>  {
    rootEl.textContent = ''
    cartPage()
  })

  // 탭
  const tabDetail = fragment.querySelector('#detail')
  const tabReviewCount = fragment.querySelector('.review-count')
  const tabReview = fragment.querySelector('#review')
  const reviewRes = await ecommerceAPI.get(`/products/${productId}/reviews`)
  let reviewCnt = 0
  // append fragment
  reviewRes.data.forEach(review => {
  const reviewFragment = document.importNode(templates.productReviewTab, true)
  const reviewEl = reviewFragment.querySelector('.review-list-box')
  const reviewDeleteEl = reviewFragment.querySelector('.review-action-btn')
  const reviewerEl = reviewFragment.querySelector('.review-viewer')
  const reviewbodyEl = reviewFragment.querySelector('.review-body')
  const reviewrateEl = reviewFragment.querySelector('.review-rate')
  const reviewDateEl = reviewFragment.querySelector('.review-date')
    reviewCnt ++
    tabReviewCount.textContent = reviewCnt
    reviewerEl.textContent = review.userId
    reviewbodyEl.textContent = review.body
    reviewrateEl.textContent = review.rating
    reviewDateEl.textContent = review.date
    if(localStorage.getItem('userId') === review.userId.toString()) {
      reviewDeleteEl.classList.remove('is-static')
    }

    // delete corresponding review row 
    reviewDeleteEl.addEventListener('click', async e => {
      reviewEl.remove()
      reviewDeleteEl.classList.add('is-loading')
      const deleteRes = await ecommerceAPI.delete(`/reviews/${review.id}`)
      reviewDeleteEl.classList.remove('is-loading')
    })

    fragment.querySelector('.review-list').appendChild(reviewFragment)
  })

  // tooltip
  $(function () { $('[data-toggle="tooltip"]').tooltip() })

  // leave review
  const reviewWritingCommentEl = fragment.querySelector('.review-input-comment')
  const reviewWritingRateEl = fragment.querySelector('.review-input-rating')
  const reviewWritingBtnEl = fragment.querySelector('.review-input-btn')

  reviewWritingBtnEl.addEventListener('click', async e => {
    const reviewFragment = document.importNode(templates.productReviewTab, true)
    const reviewEl = reviewFragment.querySelector('.review-list-box')
    const now = new Date()
    const reviewDate = now.toDateString() 
    const payload = {
      rating: reviewWritingRateEl.value,
      body: reviewWritingCommentEl.value,
      userId: localStorage.getItem('userId'),
      productId: parseInt(productId),
      date: reviewDate
    }
    reviewWritingBtnEl.classList.add('is-loading')
    const postRes = await ecommerceAPI.post(`/reviews`, payload)
    reviewWritingBtnEl.classList.remove('is-loading')
    
    console.log("Review posted")
  })

  render(fragment)
}



// 카트 페이지 매소드
async function cartPage() {
  nav()
  const cartFragment = document.importNode(templates.cartPage, true)
  const nav1 = document.importNode(templates.navigation, true) 
  const loadingEl = cartFragment.querySelector('.full-box')

  rootEl.classList.add('root--loading')
  loadingEl.classList.remove('offScreen')
  const res = await ecommerceAPI.get('/carts')
  const attRes = await ecommerceAPI.get('/attributes')  
  rootEl.classList.remove('root--loading')
  loadingEl.classList.add('offScreen')
  
  // total 변경
  const cartSubtotal = cartFragment.querySelector('#cart-subtotal')
  const cartTax = cartFragment.querySelector('#cart-tax')
  const cartTotal = cartFragment.querySelector('#cart-total')
  let calcSubTotal = 0
  const taxRate = 0.06875  
  
  // 카트 페이지 어트리뷰트 정보 불러오기
  for (const {id, userId, attributeId, size, color, quantity, marketPrice, productTitle, productDesc, imageURL} of res.data) {
    
    
    const fragment = document.importNode(templates.cartPageList, true)
    const removeBtn = fragment.querySelector('.remove-product')
    const divEl = fragment.querySelector('.product-cart')
    const inputEl = fragment.querySelector('.product-quantity')
    
    // market 고정
    const productPrice = fragment.querySelector('.product-price')
    const productSubtotal = fragment.querySelector('.product-subtot')

    function updateTotal(newSubtotal) {
      cartSubtotal.textContent = newSubtotal.toFixed(2)
      cartTax.textContent = (newSubtotal * taxRate).toFixed(2)
      cartTotal.textContent = (newSubtotal * (taxRate + 1)).toFixed(2)
    }
    
    // if(userId.toString() === localStorage.getItem('userId')) { 
    const checkoutBtn = cartFragment.querySelector('.checkout') 
    const checkoutBtn2 = cartFragment.querySelector('.checkout2') 
    const productTitleEl = fragment.querySelector('.product-title') 
    const productDescEl = fragment.querySelector('.product-description') 
    const productImgEl = fragment.querySelector('.product-cart-image') 
    const attributeColor = fragment.querySelector('.attribute-color') 
    const attributeSize = fragment.querySelector('.attribute-size') 
    const maxQtt = fragment.querySelector('.attribute-max') 
    const productQtt = fragment.querySelector('.product-quantity')

    console.log(`attributeId: ${attributeId}`)
    checkoutBtn.classList.remove("is-static")
    checkoutBtn2.classList.remove("is-static")
    productImgEl.setAttribute('src', `${imageURL}`)
    productTitleEl.textContent = productTitle
    productDescEl.textContent = productDesc
    attributeColor.textContent = color
    attributeSize.textContent = size
    productPrice.textContent = marketPrice
    // 카트 내부에서 변경될 수 있는 수량
    inputEl.value = quantity
    productSubtotal.textContent = (marketPrice * quantity).toFixed(2) 

    // calculate totals 
    calcSubTotal += marketPrice * quantity
    cartSubtotal.textContent = calcSubTotal.toFixed(2)
    cartTax.textContent = (calcSubTotal * taxRate).toFixed(2)
    cartTotal.textContent = (calcSubTotal * (taxRate + 1)).toFixed(2)
    
    // 어트리뷰트별 최대값 주기  
    attRes.data.forEach(attr => {
      if(attributeId === attr.id) {
        maxQtt.textContent = attr.quantity
        productQtt.setAttribute("max", `${attr.quantity}`)
      }
    })

    cartFragment.querySelector('.cart-page-list').appendChild(fragment) 
    // }

    // 카트 삭제하기 
    removeBtn.addEventListener("click", async e => {
      console.log("delete pressed")
      divEl.remove();
      loadingEl.classList.remove('offScreen')
      const res = await ecommerceAPI.delete(`/carts/${id}`)
      loadingEl.classList.add('offScreen')
    })

    // 수량 변경하기 
    inputEl.addEventListener("change", async e=> {
      let changeVal = parseInt(inputEl.value) - parseInt(quantity) 
      productSubtotal.textContent = (marketPrice * inputEl.value).toFixed(2)
      e.preventDefault()
      const payload = {
        quantity: parseInt(inputEl.value)
      }
      loadingEl.classList.remove('offScreen')
      const changeRes = await ecommerceAPI.patch(`/carts/${id}`, payload)
      loadingEl.classList.add('offScreen')

      calcSubTotal += (changeVal * marketPrice) 
      updateTotal(calcSubTotal)

      rootEl.textContent = '' 
      cartPage()
    }) 
  }
  render(cartFragment)
}

// 어드민 페이지 세팅
async function adminPage() {
  nav()
  const adminFragment = document.importNode(templates.adminMainPage, true)
  const loadingEl = adminFragment.querySelector('.full-box')
  const toAddProduct = adminFragment.querySelector('.admin-content')
  // add product 페이지 이동
  const addProductBtn = adminFragment.querySelector('.admin-link-add')
  addProductBtn.addEventListener("click", move => {
    const fragment = document.importNode(templates.addProductPage, true)

    // tooltip
    $(function () { $('[data-toggle="tooltip"]').tooltip() })

    // Publish product
    const publishBtn = fragment.querySelector('.add-attribute-btn') 
    const resetBtn = fragment.querySelector('.add-reset-btn') 
    const titleEl = fragment.querySelector('.add-title')
    const descEl = fragment.querySelector('.add-desc')
    // selectEl
    const categoryEl = fragment.querySelector('.add-category-options')
    const unitPriceEl = fragment.querySelector('.add-unit-price')
    const marketPriceEl = fragment.querySelector('.add-market-price')
    const imageEl = fragment.querySelector('.add-image')  
    // main attribute
    const variantEl = fragment.querySelector('.add-variants')
    const attrSKUEl = fragment.querySelector('.attr-sku__input')
    const attrColorEl = fragment.querySelector('.attr-sku__color')
    const attrSizeEl = fragment.querySelector('.attr-sku__size')
    const attrUnitPriceEl = fragment.querySelector('.attr-sku__unit-price')
    const attrMKPriceEl = fragment.querySelector('.attr-sku__market-price')
    const attrQttEl = fragment.querySelector('.attr-sku__quantity')
    const onlyPublishBtn = fragment.querySelector('.add-publish-btn')
    const addMoreBtn = fragment.querySelector('.add-more-btn')
    const imageBadge = fragment.querySelector('.image-uploaded')
    const imageFileEl = fragment.querySelector('.file-input')
    
    imageFileEl.addEventListener("click", e => {
      imageBadge.classList.remove('offScreen')
    })
    publishBtn.addEventListener("click", async e => {      
      const payload = {
        productTitle: titleEl.value,
        productDesc: descEl.value,
        category: categoryEl.value,
        imageURL: imageEl.value,
        unitPrice: parseFloat(unitPriceEl.value),
        marketPrice: parseFloat(marketPriceEl.value),
        accSoldCnt: 0,
        userId: 1
      }
      publishBtn.classList.add('is-loading')
      const res = await ecommerceAPI.post(`/products`, payload)
      publishBtn.classList.remove('is-loading')

      titleEl.setAttribute("disabled", "disabled")
      descEl.setAttribute("disabled", "disabled")
      categoryEl.setAttribute("disabled", "disabled")
      unitPriceEl.setAttribute("disabled", "disabled")
      marketPriceEl.setAttribute("disabled", "disabled")
      imageEl.setAttribute("disabled", "disabled")
      publishBtn.classList.add("is-static")
      resetBtn.classList.add("is-static")
      variantEl.classList.remove("offScreen")

      // 가장 최근의 productId 찾기
      rootEl.classList.add('root--loading')
      loadingEl.classList.remove('offScreen')
      const idRes = await ecommerceAPI.get('/products')
      rootEl.classList.remove('root--loading')
      loadingEl.classList.add('offScreen')
      
      let i = 0
      for (const {id} of idRes.data) { if(id > i) { i = id } }
      const productId = i



      // attribute posting function
      async function postAttribute(PID, SKU, SIZE, COL, QTT, UP, MP) {
        let payload2 = {
          productId: parseInt(PID),
          attrSKU: SKU.value,
          userId: 1,
          size: parseInt(SIZE.value),
          color: COL.value,
          quantity: parseInt(QTT.value),
          productUnitPrice: parseFloat(UP.value),
          productMarketPrice: parseFloat(MP.value),
          soldOut: "false",
          defaultAttr: "true"
        }
        onlyPublishBtn.classList.add('is-loading')
        const attRes = await ecommerceAPI.post(`/attributes`, payload2)
        onlyPublishBtn.classList.remove('is-loading')
        console.log("Attribute has posted!")
      } 

      onlyPublishBtn.addEventListener("click", async e => {
        postAttribute(productId, attrSKUEl, attrSizeEl, attrColorEl, attrQttEl, attrUnitPriceEl, attrMKPriceEl)
        rootEl.textContent = ''
        indexPage()
      })

      function pustMoreVariant() {
        const moreFragment = document.importNode(templates.addMoreAttr, true) 
        const publishButton = moreFragment.querySelector('.add-publish-btn')
        const addMoreButton = moreFragment.querySelector('.add-more-btn')
        
        // 변수 재선언
        const moreSKUEl = moreFragment.querySelector('.attr-sku__input')
        const moreColorEl = moreFragment.querySelector('.attr-sku__color')
        const moreSizeEl = moreFragment.querySelector('.attr-sku__size')
        const moreUnitPriceEl = moreFragment.querySelector('.attr-sku__unit-price')
        const moreMKPriceEl = moreFragment.querySelector('.attr-sku__market-price')
        const moreQttEl = moreFragment.querySelector('.attr-sku__quantity')

        publishButton.addEventListener("click", async e => {
          postAttribute(productId, moreSKUEl, moreSizeEl, moreColorEl, moreQttEl, moreUnitPriceEl, moreMKPriceEl)
          rootEl.textContent = ''
          indexPage()
        })
        toAddProduct.appendChild(moreFragment) 
      }

      addMoreBtn.addEventListener("click", async e => {
        postAttribute(productId, attrSKUEl, attrSizeEl, attrColorEl, attrQttEl, attrUnitPriceEl, attrMKPriceEl)

        attrSKUEl.setAttribute("disabled", "disabled")
        attrSizeEl.setAttribute("disabled", "disabled")
        attrColorEl.setAttribute("disabled", "disabled")
        attrQttEl.setAttribute("disabled", "disabled")
        attrUnitPriceEl.setAttribute("disabled", "disabled")
        attrMKPriceEl.setAttribute("disabled", "disabled")
        onlyPublishBtn.classList.add("is-static")
        addMoreBtn.classList.add("is-static")
        
        pustMoreVariant()
      })

    })
    toAddProduct.appendChild(fragment)    
  })
  render(adminFragment)
}

// 로그인 페이지 실행
async function loginPage() {
  const fragment = document.importNode(templates.login, true)
  const formEl = fragment.querySelector('.login__form')
  const loadingEl = fragment.querySelector('.full-box') 
  formEl.addEventListener("submit", async e => {
    const localUsername = e.target.elements.username.value
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    }
    e.preventDefault()
    rootEl.classList.add('root--loading')
    loadingEl.classList.remove('offScreen')
    const res = await ecommerceAPI.post('/users/login', payload)
    rootEl.classList.remove('root--loading')
    loadingEl.classList.add('offScreen')

    login(res.data.token, localUsername)
  })
  render(fragment)
}

// 새로고침하면 로그인이 풀리는 현상 해결
if (localStorage.getItem('token') && localStorage.getItem('username')) { 
    login(localStorage.getItem('token'), localStorage.getItem('username'))
} 

// initial login 
if(localStorage.getItem('userId') === '1') {
  adminPage() 
} else indexPage()