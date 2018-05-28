import axios from 'axios';
import { freemem } from 'os';

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
}

// Avoid code duplication
function render(fragment) {
  // rootEl.textContent = '' 
  rootEl.appendChild(fragment)
}

function login(token) {
  localStorage.setItem('token', token)
  // postAPI.defaults : 항상 기본으로 동작
  ecommerceAPI.defaults.headers['Authorization'] = `Bearer ${token}`;
  rootEl.classList.add('root--authed')
}

function logout() {
  localStorage.removeItem('token')
  // 객체의 속성을 지울 때는 delete
  delete ecommerceAPI.defaults.headers['Authorization']
  rootEl.classList.remove('root--authed')
}

async function nav() {
  const nav = document.importNode(templates.navigation, true)
  nav.querySelector('.nav-link__btn-home').addEventListener("click", e => {
    rootEl.textContent = '' 
    indexPage();
  })

  nav.querySelector('.nav-link__btn-product').addEventListener("click", e => { 
    rootEl.textContent = '' 
    productPage()
  })
  
  nav.querySelector('.cart-icon').addEventListener("click", e => {
    rootEl.textContent = ''
    cartPage()
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
    const imgEl = fragment.querySelector('.img')
    const itemTitle = fragment.querySelector('.new-products-items__title')
    const unitPrice = fragment.querySelector('.list-group-item__unitPrice')
    const marketPrice = fragment.querySelector('.list-group-item__marketPrice')

    itemTitle.textContent = product.productTitle
    unitPrice.textContent = product.unitPrice
    marketPrice.textContent = product.marketPrice

    if(product.id === res.data.length || product.id === res.data.length - 1 || product.id === res.data.length - 2 || product.id === res.data.length - 3) {
      newProFrag.querySelector('.new-products-list').appendChild(fragment)
    }
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

  // 가격 계산
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

      if(attribute.quantity === 0) { 
        inputEl.setAttribute("disabled", "disabled")
        inputEl.value = "0"
      } else 
      inputEl.setAttribute("max", `${attribute.quantity}`)    
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
          } else {
          inputEl.removeAttribute("disabled")
          inputEl.value = "1"
          inputEl.setAttribute("max", `${quantity}`)    
          }
          break
        }
        else { 
          AttrRemain.textContent = "no" 
          inputEl.value = "0" 
          inputEl.setAttribute("disabled", "disabled")
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

async function cartPage() {
  nav()
  const res = await ecommerceAPI.get(`/carts`)

  const cartFragment = document.importNode(templates.cartPage, true)
  const fragment = document.importNode(templates.cartPageList, true)
  
  res.data.forEach(cart => {

    cartFragment.querySelector('.cart-page-list').appendChild(fragment)
  })
  

  render(cartFragment)
}



// 로그인 페이지 실행
// async function loginPage() {
//   const fragment = document.importNode(templates.login, true)
//   const formEl = fragment.querySelector('.login__form')
//   formEl.addEventListener("submit", async e => {
//     const payload = {
//       username: e.target.elements.username.value,
//       password: e.target.elements.password.value
//     }
//     e.preventDefault()
//     rootEl.classList.add('root--loading')
//     const res = await todoAPI.post('/users/login', payload)
//     rootEl.classList.remove('root--loading')

//     login(res.data.token)
//     appStartPage()
//   })
//   render(fragment)
// }

// 새로고침하면 로그인이 풀리는 현상 해결
if (localStorage.getItem('token')) {
  login(localStorage.getItem('token'))
} 

if(localStorage.getItem('token')) {
  // localStrage 에 토큰들어가 있으면 무조건 appStartPage() 로 이동해라
  indexPage()
  
} else indexPage();

