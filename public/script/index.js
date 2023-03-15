'use strict'


const pages = []
const contracts = {}



document.addEventListener('DOMContentLoaded', async () => {
  await initialize()

  /*
  if(isOpen(socket)) {
    socket.send(JSON.stringify({
      type: 'connection',
      data: 'connected'
    }))
  }
  */
})



const initialize = async () => {
  await fetchPages()

  const main = document.getElementById('main')

  for (const page of pages) {
    const network = page.page
    contracts[page.page] = await fetchContracts(page.networks[0].rddUrl)

    const section = document.createElement('section')
    main.appendChild(section)
    const h2 = document.createElement('h2')
    h2.innerHTML = page.label
    section.appendChild(h2)

    const ul = document.createElement('ul')
    section.appendChild(ul)

    for (const contract of contracts[network]) {
      const li = document.createElement('li')
      li.innerHTML = contract.name
      li.id = network + '-' + contract.ens
      ul.appendChild(li)
    }

  }



}


const fetchPages = async () => {
  const list = await fetch('https://raw.githubusercontent.com/dorianbayart/documentation/main/src/features/feeds/data/chains.ts')
    .then((resp) => resp.text())
    .then((text) => text.split('CHAINS: Chain[] =').slice(-2)[0].split('export')[0]) // keep useful data
    .then((str) => ('{ data:'+str+'}').replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ').replaceAll('https": ','https:').replace(/\,(?!\s*?[\{\[\"\'\w])/g, ''))
    .then(JSON.parse)
    .then((json) => json.data)

  pages.push(...list)
}

const fetchContracts = async (url) => {
  const data = await fetch(url)
    .then((resp) => resp.text())
    .then(JSON.parse)
    .then((array) => array.sort((a, b) => a.name.localeCompare(b.name)))
  return data
}
