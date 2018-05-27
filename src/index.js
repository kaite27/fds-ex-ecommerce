import axios from 'axios';
import { freemem } from 'os';

const ecommerceAPI = axios.create({
  baseURL: process.env.API_URL
})

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
}

// Avoid code duplication
function render(fragment) {
  // rootEl.textContent = '' 
  // debugger
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
  render(nav)
}

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

  document.querySelector('.nav-link__btn-dress').addEventListener("click", e => {
    rootEl.textContent = '' 
    productPage()
  })
}

indexPage();

// 앱 실행 페이지
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

    itemTitle.textContent = product.productTitle
    itemDesc.textContent = product.productDesc
    unitPrice.textContent = product.unitPrice
    marketPrice.textContent = product.marketPrice

    productPage.querySelector('.product-page-list').appendChild(fragment)    
  })
  render(productPage)
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

// if(localStorage.getItem('token')) {
//   // localStrage 에 토큰들어가 있으면 무조건 appStartPage() 로 이동해라
//   indexPage()
  
// } else indexPage();

