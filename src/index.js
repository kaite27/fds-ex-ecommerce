import axios from 'axios';
import { freemem } from 'os';
import { ALPN_ENABLED, RSA_NO_PADDING } from 'constants';
import { createVerify } from 'crypto';
import { link } from 'fs';

const ecommerceAPI = axios.create({ baseURL: process.env.API_URL })

const rootEl = document.querySelector('.root')

// 자주 쓰는 엘리먼트 빼주기 ex) templates.postList 
const templates = {   
  navigation: document.querySelector('#navigation').content,
  mainHeader: document.querySelector('#main-header').content,
  newProducts: document.querySelector('#new-products').content,
  newProductsList: document.querySelector('#new-products-list').content,
  subscribes: document.querySelector('#subscribes').content,
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
}

// Avoid code duplication
function render(fragment) {
  // rootEl.textContent = '' 
  rootEl.appendChild(fragment)
}


async function login(token, localUsername) {
  localStorage.setItem('token', token)
  localStorage.setItem('username', localUsername)
  const res = await ecommerceAPI.get(`/users`)
  const cartRes = await ecommerceAPI.get(`/carts`)
  
  // localStorage 에 userID 저장하기 
  for(const {username, id} of res.data) {
    if(localStorage.getItem('username') === username) {
      localStorage.setItem('userId', id)
    }
  }
  let count = 0
  for(const {userId} of cartRes.data) {
    if(localStorage.getItem('userId') === userId.toString()) {
      count ++
    }
    localStorage.setItem('cartItem', count)
  }
  // postAPI.defaults : 항상 기본으로 동작
  ecommerceAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  rootEl.classList.add('root--authed')

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
  
  if(localStorage.getItem('cartItem') !== null) {
    cartBadge.textContent = `${localStorage.getItem('cartItem')}`
  }

  if(localStorage.getItem('username') !== null) {
    usernameBox.textContent = (`Welcome ${localStorage.getItem('username')} !`)
  } 

  // 홈
  nav.querySelector('.nav-link__btn-home').addEventListener("click", e => {
    rootEl.textContent = '' 
    indexPage();
  })
  // 프로덕트 
  nav.querySelector('.nav-link__btn-product').addEventListener("click", e => { 
    rootEl.textContent = '' 
    productPage()
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
  nav.querySelector('.btn-shopping-cart').addEventListener("click", e => {
    rootEl.textContent = ''
    cartPage()
  })
  // sign in -> admin
  nav.querySelector('.btn-sign-in').addEventListener("click", e => {
    rootEl.textContent = ''
    adminPage()
  })
  
  render(nav)
}

// 이커머스 메인 웹사이트 페이지 
async function indexPage() {
  nav()
  const res = await ecommerceAPI.get('/products')
  const mainHeader = document.importNode(templates.mainHeader, true)
  const newProFrag = document.importNode(templates.newProducts, true)
  const subscribe = document.importNode(templates.subscribes, true)

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

  
  render(mainHeader)
  render(newProFrag)
  render(subscribe)
}

// 중복 제거 매소드
function avoid(arr) {
  arr.filter(function(item, i, arr){
    return i == arr.indexOf(item)
  })
}

// 프로덕트 전체 리스트 페이지
async function productPage() {
  nav()
  const attRes = await ecommerceAPI.get('/attributes?_expand=product')
  const res = await ecommerceAPI.get('/products')

  const productPage = document.importNode(templates.productPage, true)

  res.data.forEach(product => {
    const fragment = document.importNode(templates.productPageList, true)
    const imgEl = fragment.querySelector('.img')
    const itemTitle = fragment.querySelector('.product-page__title')
    const itemDesc = fragment.querySelector('.product-page__desc')
    const unitPrice = fragment.querySelector('.list-group-item__unitPrice')
    const marketPrice = fragment.querySelector('.list-group-item__marketPrice')
    const colorCnt = fragment.querySelector('.list-group-item__color')
    const sizeCnt = fragment.querySelector('.list-group-item__size')
    const productDetail = fragment.querySelector('.link-to-product-detail')

    itemTitle.textContent = product.productTitle
    itemDesc.textContent = product.productDesc
    unitPrice.textContent = product.unitPrice
    marketPrice.textContent = product.marketPrice
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
    productPage.querySelector('.product-page-list').appendChild(fragment)    

    productDetail.addEventListener("click", e => {
      rootEl.textContent = '' 
      productDetailPage(product.id)
    })
  })
  render(productPage)
}

// 프로덕트 상세 페이지 
async function productDetailPage(productId) {
  nav()
  const res = await ecommerceAPI.get(`/products/${productId}`)
  const attRes = await ecommerceAPI.get('/attributes?_expand=product')

  const fragment = document.importNode(templates.productDetail, true)
  // product
  const itemTitle = fragment.querySelector('.product-detail-page__title')
  const itemDesc = fragment.querySelector('.product-detail-page__desc')
  // 가격
  const subTotal = fragment.querySelector('.price-subtotal__value')
  const tax = fragment.querySelector('.price-tax__value')
  const total = fragment.querySelector('.price-total__value')
  let marketPrice = res.data.marketPrice
  // 가격 계산
  const addCartBtn = fragment.querySelector('.btn_submit--cart')  
  const inputEl = fragment.querySelector('.option-quantity')
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

      console.log(typeof(attribute.quantity))
      console.log("heelop?")

      if(attribute.quantity >= 1) { 
        console.log(typeof(attribute.quantity))
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
  
  // 카트에 담기 
  addCartBtn.addEventListener("click", async e => {
    console.log("pressed?")
    e.preventDefault()
    const payload = {
      productTitle: itemDesc.textContent,
      productId: productId,
      userId: parseInt(`${localStorage.getItem('userId')}`),
      productDesc: itemDesc.textContent,
      size: parseInt(selectElSize.value),
      color: selectElColor.value,
      quantity: parseInt(inputEl.value),
      marketPrice: marketPrice,
      subtotalPrice: parseFloat(subTotal.textContent),
      attributeId: 1
    }
    const res = await ecommerceAPI.post(`/carts`, payload)
    console.log("psost?")
  })

  // 탭
  const tabDetail = fragment.querySelector('#detail')
  const tabReview = fragment.querySelector('#review')

  itemTitle.textContent = res.data.productTitle
  itemDesc.textContent = res.data.productDesc
  subTotal.textContent = res.data.marketPrice.toFixed(2)
  tax.textContent = ((res.data.marketPrice) * 0.06875).toFixed(2)
  total.textContent = (res.data.marketPrice * ( 0.06875 + 1 )).toFixed(2)

  render(fragment)
}



// 카트 페이지
async function cartPage() {
  nav()
  const res = await ecommerceAPI.get(`/carts`)
  const attRes = await ecommerceAPI.get('/attributes')  
  const cartFragment = document.importNode(templates.cartPage, true)
  const nav1 = document.importNode(templates.navigation, true)
  // total 변경
  const cartSubtotal = cartFragment.querySelector('#cart-subtotal')
  const cartTax = cartFragment.querySelector('#cart-tax')
  const cartTotal = cartFragment.querySelector('#cart-total')
  let calcSubTotal = 0
  const taxRate = 0.06875  
  
  // 카트 페이지
  for (const {id, userId, productId, attributeId, productTitle, productDesc, size, color, quantity, marketPrice} of res.data) {
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
    
    // 카트 삭제하기 
    removeBtn.addEventListener("click", async e => {
      console.log("delete pressed")
      divEl.remove();
      const res = await ecommerceAPI.delete(`/carts/${id}`)
    })

    // 수량 변경하기 
    inputEl.addEventListener("change", async e=> {
      let changeVal = parseInt(inputEl.value) - parseInt(quantity) 
      productSubtotal.textContent = (marketPrice * inputEl.value).toFixed(2)
      e.preventDefault()
      const payload = {
        quantity: parseInt(inputEl.value)
      }
      const changeRes = await ecommerceAPI.patch(`/carts/${id}`, payload) 
      
      calcSubTotal += (changeVal * marketPrice) 
      updateTotal(calcSubTotal)
      // refresh 해주면 quantity 업데이트 됨;;
      rootEl.textContent = '' 
      cartPage()
    })  

    if(userId.toString() === localStorage.getItem('userId')) { 
    const checkoutBtn = cartFragment.querySelector('.checkout') 
    const checkoutBtn2 = cartFragment.querySelector('.checkout2') 
    const productTitle = fragment.querySelector('.product-title') 
    const productDesc = fragment.querySelector('.product-description') 
    const attributeColor = fragment.querySelector('.attribute-color') 
    const attributeSize = fragment.querySelector('.attribute-size') 
    const maxQtt = fragment.querySelector('.attribute-max') 
    const productQtt = fragment.querySelector('.product-quantity')
    
    checkoutBtn.removeAttribute("disabled")
    checkoutBtn2.removeAttribute("disabled")
    productTitle.textContent = productTitle
    productDesc.textContent = productDesc
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
    for (const {quantity, id} of attRes.data) {
      if(attributeId === id) {
        maxQtt.textContent = quantity
        console.log(typeof(quantity))
        productQtt.setAttribute("max", `${quantity}`)
      }
    }
    cartFragment.querySelector('.cart-page-list').appendChild(fragment) 
    }
  }
  render(cartFragment)
}





// 어드민 페이지 세팅
async function adminPage() {
  nav()
  const adminFragment = document.importNode(templates.adminMainPage, true)
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
      const res = await ecommerceAPI.post(`/products`, payload)

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
      const idRes = await ecommerceAPI.get('/products')
      let i = 0
      for (const {id} of idRes.data) { if(id > i) { i = id } }
      const productId = i

      // attribute posting function
      async function postAttribute() {
        const payload2 = {
          productId: parseInt(productId),
          attrSKU: attrSKUEl.value,
          size: attrSizeEl.value,
          color: attrColorEl.value,
          quantity: parseInt(attrQttEl.value),
          productUnitPrice: parseFloat(attrUnitPriceEl.value),
          productMarketPrice: parseFloat(attrMKPriceEl.value),
          soldOut: "false",
          defaultAttr: "true"
        }
        const attRes = await ecommerceAPI.post(`/attributes`, payload2)
        console.log("Attribute has posted!")
      } 

      onlyPublishBtn.addEventListener("click", async e => {
        postAttribute()
        rootEl.textContent = ''
        indexPage()
      })

      addMoreBtn.addEventListener("click", async e => {
        postAttribute()

        const moreFragment = document.importNode(templates.addMoreAttr, true)
        toAddProduct.appendChild(moreFragment) 
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
  formEl.addEventListener("submit", async e => {
    const localUsername = e.target.elements.username.value
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    }
    e.preventDefault()
    rootEl.classList.add('root--loading')
    const res = await ecommerceAPI.post('/users/login', payload)
    rootEl.classList.remove('root--loading')

    login(res.data.token, localUsername)
    rootEl.textContent = '' 
    indexPage()
  })
  render(fragment)
}

// 새로고침하면 로그인이 풀리는 현상 해결
if (localStorage.getItem('token') && localStorage.getItem('username')) {  
    login(localStorage.getItem('token'), localStorage.getItem('username'))
} 

// if(localStorage.getItem('token')) {
  // localStrage 에 토큰들어가 있으면 무조건 appStartPage() 로 이동해라
indexPage()
  
// } else indexPage()
