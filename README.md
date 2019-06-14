<p align="center">
  <h3 align="center">https://github.com/beigenut/fds-ex-ecommerce</h3>
  <p align="center">
  Build a `SPA eCommerce` website. The site offers Administrator features including `Add-new-product.`<a href="https://ecommerce-json.netlify.com" target="_blank"> Click here</a> <br>
  Please follow the login instructor on Login Page :)
</p>
</p>

_ _ _


## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* Getting Started
  * [Prerequisites](#prerequisites)
* [Usage](#usage)
* [Contributing](#contributing)
* [Contact](#contact)

## About The Project

<img src="https://drive.google.com/uc?export=view&id=1e7Dr29ARsXYjOBy8DvPqR627GFeDDFiK" width="700px">

Build a web application to send a mobile invitation for upcomming wedding event.

Features :

- New arrivals; Load the most recently added product. 
- `Subcribes`; Send email to administrator.
- `Cart`; Add item(s) on cart.
- Product detail page.
- Product `review`; Write/Delete review. 
- `Add new product`; Post new product and related attribute(s) through Axios request.



### Built With
* [bulma](https://bulma.io)
* [glitch server](https://glitch.com/)
* [Axios](https://github.com/axios/axios)
* [parcel](https://parceljs.org/)


<!-- GETTING STARTED -->
## Getting Started

### Prerequisites
 
`npm i axios babel-preset-react-app node-sass parcel-bundler rimraf`

<!-- USAGE EXAMPLES -->
## Usage

#### template tag 

To build SPA web site by using template tags an empty box element needed. 

```html
<div class="root"></div>
```

Use the `render()` method to insert a fragment into the `.root` element.

```js
function render(fragment) {
  document.querySelector('.root').appendChild(fragment)
}
```

All template elements are stored in one object(i.e. templates).

```js
const templates = {   
  navigation: document.querySelector('#navigation').content,
  ...
}
```

Use `importNode()` method to load the node into the DOM where .root element existed. 

Type `true` value to add all of the child elements.

```js
const fragment = document.importNode(templates.navigation, true)
//...
render(fragment)
```

For more information about .importNode() [here](https://developer.mozilla.org/ko/docs/Web/API/Document/importNode)

#### User Info

The information of the logged-in user is stored in `localStorage.`




<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- CONTACT -->
## Contact

Project Link: [https://github.com/beigenut/fds-ex-ecommerce](https://github.com/beigenut/fds-ex-ecommerce)



