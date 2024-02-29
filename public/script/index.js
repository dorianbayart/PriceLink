'use strict'

import * as Plot from 'plot'

const pages = []
const contracts = {}

const screener = []

const repoUrl = 'https://raw.githubusercontent.com/dorianbayart/documentation/'
const imgBaseUrl = repoUrl + 'main/public'

let web3 = null

let searchInput = null, backFromDetails = null, detailsContract = null

document.addEventListener('DOMContentLoaded', async () => {
  web3 = {}

  Object.keys(NETWORK).forEach((network) => {
    if (NETWORK[network].rpc.length > 0) {
      web3[network] = new Web3(NETWORK[network].rpc)
    }
  })

  searchInput = document.getElementById('search')
  searchInput.addEventListener('input', updateMain)

  backFromDetails = document.getElementById('backFromDetails')
  backFromDetails.addEventListener('click', hideDetails)

  initialize()
})

const initialize = async () => {
  const storedPages = JSON.parse(localStorage.getItem('pages'))
  if(storedPages) {
    pages.push(...storedPages)

    const storedContracts = JSON.parse(localStorage.getItem('contracts'))
    if(storedContracts) {
      for (var networkId of Object.keys(storedContracts)) {
        contracts[networkId] = storedContracts[networkId]
      }
    } else {
      await populateContracts()
    }

    setTimeout(async () => {
      await fetchPages()
      updateMain()
    }, 1500)
  } else {
    await fetchPages()
  }


  initializeScreener()
  updateMain()

  setTimeout(updatePrice, 2000)
}

const initializeScreener = async () => {
  const storedScreener = JSON.parse(localStorage.getItem('screener'))
  console.log('storedScreener', storedScreener)

  if(storedScreener) {
    screener.push(...storedScreener)
    updateScreener()
  } else {
    for(const item of SCREENER_INITIALIZER) {
      await addToScreener(item)
    }
  }
}

const populateContracts = async () => {
  for (const page of pages) {
    for (const network of page.networks) {
      const networkId = page.page + '.' + network.name.toLowerCase().replaceAll(' ', '-')
      if(!contracts[networkId]) contracts[networkId] = await fetchContracts(network.rddUrl)

      contracts[networkId].forEach((contract) => {
        const prefix = definePrefix(contract.path)
        if(prefix && prefix !== contract.valuePrefix) contract.valuePrefix = prefix
        contract.networkId = networkId
      })
    }
  }

  localStorage.setItem('contracts', JSON.stringify(contracts))
}

const updateMain = async () => {
  const main = document.getElementById('main')

  for (const page of pages) {
    for (const network of page.networks) {
      const networkId = page.page + '.' + network.name.toLowerCase().replaceAll(' ', '-')

      const section = document.getElementById('section.' + networkId) ?? document.createElement('section')
      section.id = 'section.' + networkId
      main.appendChild(section)
      const h2 = document.getElementById('h2.' + networkId) ?? document.createElement('h2')
      h2.innerHTML = null
      h2.id = 'h2.' + networkId
      h2.classList.add('unselectable')
      const img = document.createElement('img')
      img.src = imgBaseUrl + page.img
      img.alt = page.label
      img.title = page.label
      const spanH2 = document.createElement('span')
      spanH2.innerHTML = network.networkType === 'mainnet' ? network.name : page.label + ' - ' + network.name
      h2.appendChild(img)
      h2.appendChild(spanH2)
      section.appendChild(h2)

      const ul = document.getElementById('ul.' + networkId) ?? document.createElement('ul')
      ul.id = 'ul.' + networkId
      ul.classList.add('unselectable')
      ul.innerHTML = null
      section.appendChild(ul)

      for (const contract of contracts[networkId]) {
        if(!contract.name?.toLowerCase().includes(search.value.toLowerCase())
          && !contract.docs?.assetName?.toLowerCase().includes(search.value.toLowerCase())
          && !contract.feedType?.toLowerCase().includes(search.value.toLowerCase())) continue
        const li = document.createElement('li')
        const divName = document.createElement('div')
        divName.classList.add('name')
        divName.innerHTML = contract.name
        li.appendChild(divName)

        const divAsset = document.createElement('div')
        divAsset.classList.add('asset')
        divAsset.innerHTML = contract.docs?.assetName ?? ''
        li.appendChild(divAsset)

        const divType = document.createElement('div')
        divType.classList.add('type')
        divType.innerHTML = contract.docs?.feedType ?? ''
        li.appendChild(divType)

        const divThreshold = document.createElement('div')
        divThreshold.classList.add('threshold')
        divThreshold.innerHTML = contract.threshold + '%'
        li.appendChild(divThreshold)

        const divHeartbeat = document.createElement('div')
        divHeartbeat.classList.add('heartbeat')
        divHeartbeat.innerHTML = contract.heartbeat + 's'
        li.appendChild(divHeartbeat)

        li.id = networkId + '+' + contract.path
        li.classList.add('unselectable')
        li.addEventListener('click', addToScreener)
        ul.appendChild(li)
      }
    }
  }
}

const updateScreener = async () => {
  const ul = document.getElementById('screener')

  if(ul.children.length) {
    Array.from(ul.children).forEach((li) => {
      if(!isInScreener(li.id)) li.remove()
    })
  }
  // ul.innerHTML = null

  screener.forEach((contract) => {
    let li = document.getElementById('screener' + contract.networkId + '+' + contract.path)
    if (!li) {
      const page = pages.find(page => page.page === contract.networkId.split('.')[0])
      const li = document.createElement('li')
      const divChainLogo = document.createElement('div')
      divChainLogo.classList.add('chain-logo-container')
      const imgChain = document.createElement('img')
      imgChain.classList.add('chain-logo')
      imgChain.src = imgBaseUrl + page.img
      imgChain.alt = page.label
      imgChain.title = page.label
      divChainLogo.appendChild(imgChain)

      const divName = document.createElement('div')
      divName.classList.add('name')
      divName.innerHTML = contract.assetName

      const divDate = document.createElement('div')
      divDate.classList.add('date')
      divDate.id = contract.networkId + '+' + contract.path + 'date'
      if (contract.timestamp)
      divDate.innerHTML = (new Date(contract.timestamp)).toLocaleString()

      const divPrice = document.createElement('div')
      divPrice.classList.add('price')
      divPrice.id = contract.networkId + '+' + contract.path + 'price'
      if (contract.price) {
        divPrice.innerHTML = contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals))
        if (contract.price > contract.averagePrice) divPrice.classList.add('up')
        else if (contract.price < contract.averagePrice) divPrice.classList.add('down')
      }

      const divPercent = document.createElement('div')
      divPercent.classList.add('percent')
      divPercent.id = contract.networkId + '+' + contract.path + 'percent'
      if (contract.percentChange24h) {
        divPercent.innerHTML = (contract.percentChange24h > 0 ? '+' : '') + roundPercentage(contract.percentChange24h)+'%'
        if (contract.percentChange24h > 0) divPercent.classList.add('up')
        else if (contract.percentChange24h < 0) divPercent.classList.add('down')
      }

      const divGraph = document.createElement('div')
      divGraph.classList.add('graph')
      divGraph.id = contract.networkId + '+' + contract.path + 'graph'
      if(contract.history.length > 1) {
        const plot = Plot.line(
          contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
          { stroke: "ghostwhite" }).plot({ height: 48, width: 48, axis: null });
        divGraph.append(plot)
      }

      li.id = 'screener' + contract.networkId + '+' + contract.path
      li.classList.add('unselectable')
      li.addEventListener('click', removeFromScreener)
      li.appendChild(divChainLogo)
      li.appendChild(divName)
      li.appendChild(divPrice)
      li.appendChild(divDate)
      li.appendChild(divPercent)
      li.appendChild(divGraph)
      ul.appendChild(li)
    } else {
      let price = document.getElementById(contract.networkId + '+' + contract.path + 'price')
      if(price) {
        price.innerHTML = contract.price ? contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals)) : ''
        if (contract.price > contract.averagePrice) {
          price.classList.toggle('down', false)
          price.classList.add('up')
        } else if (contract.price < contract.averagePrice) {
          price.classList.toggle('up', false)
          price.classList.add('down')
        }
      }
      let percent = document.getElementById(contract.networkId + '+' + contract.path + 'percent')
      if(percent) {
        percent.innerHTML = contract.percentChange24h ? (contract.percentChange24h > 0 ? '+' : '') + roundPercentage(contract.percentChange24h)+'%' : ''
        if (contract.percentChange24h > 0) {
          percent.classList.toggle('down', false)
          percent.classList.add('up')
        } else if (contract.percentChange24h < 0) {
          percent.classList.toggle('up', false)
          percent.classList.add('down')
        }
      }
      let date = document.getElementById(contract.networkId + '+' + contract.path + 'date')
      if(date) date.innerHTML = contract.timestamp ? (new Date(contract.timestamp)).toLocaleString() : ''

      let divGraph = document.getElementById(contract.networkId + '+' + contract.path + 'graph')
      if(divGraph && contract.history.length > 1) {
        divGraph.innerHTML = null
        const plot = Plot.line(
          contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
          { stroke: "ghostwhite" }).plot({ height: 48, width: 48, axis: null });
        divGraph.append(plot)
      }
    }
  })
}

const updateScreenerByContract = async (contract) => {
  let price = document.getElementById(contract.networkId + '+' + contract.path + 'price')
  if(price) {
    price.innerHTML = contract.price ? contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals)) : ''
    if (contract.price > contract.averagePrice) {
      price.classList.toggle('down', false)
      price.classList.add('up')
    } else if (contract.price < contract.averagePrice) {
      price.classList.toggle('up', false)
      price.classList.add('down')
    }
  }
  let percent = document.getElementById(contract.networkId + '+' + contract.path + 'percent')
  if(percent) {
    percent.innerHTML = contract.percentChange24h ? (contract.percentChange24h > 0 ? '+' : '') + roundPercentage(contract.percentChange24h)+'%' : ''
    if (contract.percentChange24h > 0) {
      percent.classList.toggle('down', false)
      percent.classList.add('up')
    } else if (contract.percentChange24h < 0) {
      percent.classList.toggle('up', false)
      percent.classList.add('down')
    }
  }
  let date = document.getElementById(contract.networkId + '+' + contract.path + 'date')
  if(date) date.innerHTML = contract.timestamp ? (new Date(contract.timestamp)).toLocaleString() : ''

  let divGraph = document.getElementById(contract.networkId + '+' + contract.path + 'graph')
  if(divGraph && contract.history.length > 1) {
    divGraph.innerHTML = null
    const plot = Plot.line(
      contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
      { stroke: "ghostwhite" }).plot({ height: 48, width: 48, axis: null });
    divGraph.append(plot)
  }

  if(contract.networkId + '+' + contract.path === detailsContract) {
    addToDetails(contract)
  }
}

const updatePrice = async (contract) => {
  let delay = 2500
  if(screener.length > 0) {
    const maxDelay = Math.floor(Math.log2(screener.length+1) * 5000 + 10000)
    const contractsToUpdate = screener.filter((contract) => !contract.updatedAt || Date.now() - contract.updatedAt > maxDelay)
    const contractToUpdate = (contract ?? contractsToUpdate[Math.floor(Math.random() * contractsToUpdate.length)])

    if(contractToUpdate) {
      delay = Math.floor(Math.random() * 600 + 400)

      let web3 = getWeb3(contractToUpdate.networkId)
      if(web3) {
        try {
          contractToUpdate.updatedAt = Date.now()
          const latestRoundData = await getLatestRoundWeb3(contractToUpdate.proxyAddress, contractToUpdate.networkId)
          if(!latestRoundData) return

          contractToUpdate.price = latestRoundData.answer
          contractToUpdate.timestamp = Number(latestRoundData.updatedAt + "000")

          if(contractToUpdate.roundId !== latestRoundData.roundId || contractToUpdate.history[contractToUpdate.history.length-1].roundId !== latestRoundData.roundId) {
            contractToUpdate.roundId = latestRoundData.roundId
            updateHistory(contractToUpdate)
          }

          updateScreenerByContract(contractToUpdate)

        } catch(e) { console.error(e) }
      }
    }
  }

  if(!contract) setTimeout(updatePrice, delay)

  localStorage.setItem('screener', JSON.stringify(screener))
}

const updateHistory = async (contract) => {
  let screenerUpdated = false

  const num = BigInt(contract.roundId)
  const num2 = BigInt("0xFFFFFFFFFFFFFFFF")
  const phaseId = num >> 64n
  const aggregatorRoundId = num & num2
  const round = (phaseId << 64n) | (aggregatorRoundId)

  if(contract.history === undefined || typeof(contract.history) === 'boolean' || contract.history.findIndex(p => Number(p.updatedAt)+86400 > Date.now()/1000) === -1) {
    contract.history = []
  }

  const mostRecentHistoryRoundId = contract.history.length > 0 ? BigInt(contract.history[contract.history.length-1].roundId) : undefined

  // Build a 24h simplified history = 86400 seconds
  let i = 0n
  while(
    (contract.history.length === 0 || Number(contract.history[0].updatedAt) > Date.now()/1000 - 86400) && round > i
    || (mostRecentHistoryRoundId && (mostRecentHistoryRoundId + i < BigInt(contract.roundId)))
  ) {
    const roundData = await getRoundDataWeb3(contract.proxyAddress, round - i, contract.networkId)
    if(Number(roundData.answer) > 0) {
      if(contract.history.length && roundData.updatedAt > contract.history[contract.history.length-1].updatedAt) {

        contract.history.push(roundData)
        const index = contract.history.findIndex(p => Number(p.updatedAt)+86400 > Date.now()/1000) - 1
        if(index > -1) {
          contract.history.slice(index)
        }
      } else {
        contract.history.unshift(roundData)
      }

      if(contract.heartbeat <= 3600) {
        i += contract.heartbeat <= 120 ? 240n : 12n
      } else {
        if(contract.history.length > 2 && Number(contract.history[contract.history.length-2].updatedAt) + 15 * 60 > Number(contract.history[contract.history.length-1].updatedAt)) {
          i += 4n
        } else {
          i++
        }
      }

      contract.history.sort((a,b) => a.updatedAt.localeCompare(b.updatedAt))
      contract.averagePrice = contract.history.reduce((acc, val) => acc + Number(val.answer), 0) / contract.history.length
      contract.percentChange24h = (Number(contract.price) - Number(contract.history[0].answer))/Number(contract.history[0].answer)*100
      updateScreenerByContract(contract)
      screenerUpdated = true
    } else {
      console.error(contract.name + ' had a problem fetching history', contract, roundData)
      continue
    }
  }

  contract.history.sort((a,b) => a.updatedAt.localeCompare(b.updatedAt))
  contract.percentChange24h = (Number(contract.price) - Number(contract.history[0].answer))/Number(contract.history[0].answer)*100
  if(!screenerUpdated) updateScreenerByContract(contract)
}

const addToScreener = async (e) => {
  if (!e.target?.id && e.target?.parentElement) e = e.target.parentElement
  if (e.target?.id) e = e.target

  if (isInScreener(e.id)) return

  const contract = searchContract(e.id)
  screener.push(contract)
  updateScreener()
  updatePrice(contract)
}

const addToDetails = async (contract) => {
  document.getElementById('details-assetName').innerHTML = contract.assetName
  document.getElementById('details-name').innerHTML = contract.name
  document.getElementById('details-feedType').innerHTML = contract.feedType
  const price = document.getElementById('details-price')
  price.innerHTML = contract.price ? contract.valuePrefix + roundPrice(contract.price * Math.pow(10, -contract.decimals)) : ''
  const percent = document.getElementById('details-percentChange')
  percent.innerHTML = contract.percentChange24h ? (contract.percentChange24h > 0 ? '+' : '') + roundPercentage(contract.percentChange24h)+'%' : ''

  if (contract.price > contract.averagePrice) {
    price.classList.toggle('down', false)
    price.classList.add('up')
  } else if (contract.price < contract.averagePrice) {
    price.classList.toggle('up', false)
    price.classList.add('down')
  }

  if (contract.percentChange24h > 0) {
    percent.classList.toggle('down', false)
    percent.classList.add('up')
  } else if (contract.percentChange24h < 0) {
    percent.classList.toggle('up', false)
    percent.classList.add('down')
  }

  let divGraph = document.getElementById('details-graph')
  if(divGraph && contract.history.length > 1) {
    divGraph.innerHTML = null
    const plot = Plot.line(
      contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
      { stroke: "ghostwhite" }).plot({ height: window.innerHeight - 80, width: window.innerWidth, axis: null });
    divGraph.append(plot)
  }
}

const removeFromScreener = async (e) => {
  if (e.target.tagName.toLowerCase() !== 'li') e = e.target.parentElement
  if (e.target?.id) e = e.target

  if (isInScreener(e.id)) {
    const contract = screener.find(
      (contract) => e.id.split('+')[0].includes(contract.networkId) && contract.path === e.id.split('+')[1]
    )


    scrollTo(0, 0)
    Array.from(document.getElementsByClassName("translatable")).forEach((item, i) => {
      item.classList.add("translated")
    })

    detailsContract = contract.networkId + '+' + contract.path

    addToDetails(contract)
  }
  /*return

  if (isInScreener(e.id)) {
    screener.splice(
      screener.findIndex(
        (contract) => e.id.split('+')[0].includes(contract.networkId) && contract.path === e.id.split('+')[1]
      ),
      1
    )
    updateScreener()
  }*/
}

const hideDetails = async (e) => {
  detailsContract = null

  Array.from(document.getElementsByClassName("translatable")).forEach((item, i) => {
    item.classList.remove("translated")
  })
}

const isInScreener = (id) => {
  return (
    screener.filter(
      (contract) => id.split('+')[0].includes(contract.networkId) && contract.path === id.split('+')[1]
    ).length > 0
  )
}

const searchContract = (id) => {
  return contracts[id.split('+')[0]].find((contract) => contract.path === id.split('+')[1])
}

const fetchPages = async () => {
  const list = await fetch(repoUrl + 'main/src/features/data/chains.ts')
    .then((resp) => resp.text())
    .then((text) => text.split('CHAINS: Chain[] =').slice(-2)[0].split('// All')[0]) // keep useful data
    .then((str) =>
    ('{ data:' + str + '}')
    .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
    .replaceAll('https": ', 'https:')
    .replace(/\,(?!\s*?[\{\[\"\'\w])/g, '')
  )
  .then(JSON.parse)
  .then((json) => json.data)

  list.forEach(page => {
    const i = pages.findIndex(p => p.label === page.label)
    if(i > -1) {
      pages[i] = page
    } else {
      pages.push(page)
    }
  })

  //pages.push(...list)

  await populateContracts()

  localStorage.setItem('pages', JSON.stringify(pages))
}

const fetchContracts = async (url) => {
  const data = await fetch(url)
  .then((resp) => resp.text())
  .then(JSON.parse)
  .then((array) => array.sort((a, b) => a.name.localeCompare(b.name)))
  return data
}

/* Utils - Round a price */
const roundPrice = (price) => {
  if(price < 0.01) return Math.round(price * 1000000) / 1000000
  if(price < 1) return Math.round(price * 10000) / 10000
  if(price < 10) return Math.round(price * 1000) / 1000
  if(price < 1000) return Math.round(price * 100) / 100
  if(price < 10000) return Math.round(price * 10) / 10
  if(price > 1000000000) return Math.round(price / 1000000000) + 'b'
  if(price > 1000000) return Math.round(price / 1000000) + 'm'
  return Math.round(price)
}

const roundPercentage = (percentage) => {
  return percentage.toFixed(1)
}

const definePrefix = (path) => {
  const key = Object.keys(SYMBOLS).find(key => path.endsWith(key))
  if(key) return SYMBOLS[key]
  return
}

/* Utils - Return the web3 to use depending on the network */
const getWeb3 = (network) => {
  if(web3) return web3[network]
  return
}

// Get latest price
const getLatestRoundWeb3 = async (adress, network) => {
  const web3 = getWeb3(network)
  if(!web3) return
  let contract = new (web3.eth).Contract(ABI, adress)
  return await contract.methods.latestRoundData().call(async (error, value) => {
    return value
  })
}

// Get historical price
const getRoundDataWeb3 = async (adress, roundId, network) => {
  let contract = new (getWeb3(network).eth).Contract(ABI, adress)
  return await contract.methods.getRoundData(roundId).call(async (error, value) => {
    return value
  })
}
