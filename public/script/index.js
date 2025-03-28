'use strict'

import { ABI, NETWORK, SCREENER_INITIALIZER, SYMBOLS } from 'constant'
import * as Plot from 'plot'

let CHAINS_TO_ID = []
let CHAINS_TO_RPC = []
let pages = []
const contracts = {}
const dragDrop = { from: -1, to: -1 }

const GAP_TIME = 600 // 10 minutes gap for history

const screener = []

const repoUrl = 'https://raw.githubusercontent.com/dorianbayart/documentation/'
const imgBaseUrl = repoUrl + 'main/public'

let web3 = null
const rpcIndexes = {}

let searchInput = null, backFromDetails = null, detailsContract = null

document.addEventListener('DOMContentLoaded', async () => {
  web3 = {}

  searchInput = document.getElementById('search')
  searchInput.addEventListener('input', updateMain)

  backFromDetails = document.getElementById('backFromDetails')
  backFromDetails.addEventListener('click', hideDetails)

  initialize()
})

const initialize = async () => {
  CHAINS_TO_ID = Object.values(
    await fetch(repoUrl + 'main/src/config/data/chains.json')
      .then((resp) => resp.text())
      .then(JSON.parse)
    )
  console.log('CHAINS_TO_ID', CHAINS_TO_ID)

  CHAINS_TO_RPC = await fetch('https://chainid.network/chains_mini.json')
    .then((resp) => resp.text())
    .then(JSON.parse)
  console.log('CHAINS_TO_RPC', CHAINS_TO_RPC)

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
    // Filter out contracts with invalid history data
    const validScreener = storedScreener.filter(contract => contract && (!contract.history || Array.isArray(contract.history)))

    screener.push(...validScreener)
    updateScreener()

    // Schedule initial history check for all contracts
    screener.forEach(contract => {
      setTimeout(() => {
        if (contract) {
          const now = Date.now()/1000; // seconds
          const needsUpdate = !contract.history || 
                             contract.history.length === 0 || 
                             !contract.history.some(point => now - Number(point.updatedAt) < 300)
          
          if (needsUpdate) {
            updateHistory(contract)
          }
        }
      }, Math.random() * 1000 + 500) // Stagger initial update checks
    })
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

      if(contracts[networkId].filter(contract => search.value.length === 0 || contract.name?.toLowerCase().includes(search.value.toLowerCase())
        || contract.docs?.assetName?.toLowerCase().includes(search.value.toLowerCase())
        || contract.feedType?.toLowerCase().includes(search.value.toLowerCase())).length) {
          section.style.display = ''
        } else {
          section.style.display = 'none'
        }

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

  if(ul.getAttribute('listeners') !== 'true') {
    ul.addEventListener('dragover', allowDrop)
    ul.addEventListener('drop', drop)
    ul.setAttribute('listener', 'true')
  }

  if(ul.children.length) {
    Array.from(ul.children).forEach((li) => {
      if(!isInScreener(li.id)) li.remove()
    })
  }
  // ul.innerHTML = null

  screener.forEach((contract) => {
    if(!contract) return
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
      divName.innerHTML = contract.assetName?.length ? contract.assetName : contract.name

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
      if(contract.history?.length > 1) {
        const plot = Plot.line(
          contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
          { stroke: "ghostwhite", curve: "monotone-x" }).plot({ height: 48, width: 48, axis: null });
        divGraph.append(plot)
      }

      li.id = 'screener' + contract.networkId + '+' + contract.path
      li.classList.add('unselectable')
      li.draggable = true
      li.addEventListener('click', removeFromScreener)
      li.addEventListener('dragstart', drag)

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
      if(divGraph && contract.history?.length > 1) {
        divGraph.innerHTML = null
        const plot = Plot.line(
          contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
          { stroke: "ghostwhite", curve: "monotone-x" }).plot({ height: 48, width: 48, axis: null });
        divGraph.append(plot)
      }
    }
  })
}

const drag = (ev) => {
  let target = ev.target
  while(target.tagName !== "LI" || !target.id) {
    target = target.parentElement
  }
  const movedItemPosition = screener.findIndex(item => item && 'screener' + item.networkId + '+' + item.path === target.id)
  if(ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move'
  dragDrop.from = movedItemPosition
  const trash = document.getElementById('trash')
  trash.style.display = 'flex'
  if(trash.getAttribute('listeners') !== 'true') {
    trash.addEventListener('dragover', dragOverTrash)
    trash.addEventListener('drop', dropTrash)
    trash.setAttribute('listener', 'true')
  }
}

const allowDrop = (ev) => {
  ev.preventDefault()
  let target = ev.target
  if(!target || !target.id || target.id === 'screener') return
  while(target.tagName !== "LI" || !target.id) {
    target = target.parentElement
  }
  const moveToPosition = screener.findIndex(item => item && 'screener' + item.networkId + '+' + item.path === target.id)
  if(ev.dataTransfer) ev.dataTransfer.dropEffect = 'move'
  dragDrop.to = moveToPosition
}

const dragOverTrash = (ev) => {
  ev.preventDefault()
  dragDrop.to = -1
}

const drop = (ev) => {
  ev.preventDefault()
  if(dragDrop.from !== dragDrop.to) {
    if(dragDrop.to === -1 && ev.target?.tagName === "IMG") {
      screener.splice(dragDrop.from, 1)
    } else if (dragDrop.to > -1) {
      const item = screener[dragDrop.from]
      screener.splice(dragDrop.from, 1)
      screener.splice(dragDrop.to, 0, item)
    }
    document.getElementById('screener').innerHTML = null
    updateScreener()
  }

  dragDrop.from = -1
  dragDrop.to = -1
  document.getElementById('trash').style.display = 'none'
}

const dropTrash = (ev) => {
  ev.preventDefault()
  if(dragDrop.from !== dragDrop.to) {
    screener.splice(dragDrop.from, 1)
    document.getElementById('screener').innerHTML = null
    updateScreener()
  }

  dragDrop.from = -1
  dragDrop.to = -1
  document.getElementById('trash').style.display = 'none'
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
  if(divGraph && contract.history?.length > 1) {
    divGraph.innerHTML = null
    const plot = Plot.line(
      contract.history.map(point => { return [new Date(Number(point.startedAt+"000")), Number(point.answer)] }).filter(point => point[0].getTime() > Date.now() - 86400000),
      { stroke: "ghostwhite", curve: "monotone-x" }).plot({ height: 48, width: 48, axis: null });
    divGraph.append(plot)
  }

  if(contract.networkId + '+' + contract.path === detailsContract) {
    addToDetails(contract)
  }
}

const updatePrice = async (contract) => {
  let delay = 2500
  if(screener.length > 0) {
    const maxDelay = Math.floor(Math.log2(screener.length+1) * 5000 + 5000)
    const contractsToUpdate = screener.filter((contract) => contract && (!contract.updatedAt || Date.now() - contract.updatedAt > maxDelay))
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

          if(!contractToUpdate.roundId || !latestRoundData.roundId || contractToUpdate.history.length === 0 || contractToUpdate.roundId !== latestRoundData.roundId || contractToUpdate.history[contractToUpdate.history.length-1].roundId !== latestRoundData.roundId) {
            contractToUpdate.roundId = latestRoundData.roundId

            if(Math.random() < 0.1) removeDuplicateHistoryPoints(contractToUpdate)
            updateHistory(contractToUpdate)
          }

          updateScreenerByContract(contractToUpdate)

        } catch(e) {
          // console.error(e)
        }
      }
    }
  }

  

  localStorage.setItem('screener', JSON.stringify(screener))

  if(!contract) setTimeout(updatePrice, delay)
}

const updateHistory = async (contract) => {
  // console.log(`updateHistory called for ${contract.assetName || 'unknown contract'}`)
  let screenerUpdated = contract.history?.length > 5

  // Store the initial length to check if we had history before
  if (!contract.history) contract.history = []
  const initialHistoryLength = contract.history.length

  const num = BigInt(contract.roundId)
  const num2 = BigInt("0xFFFFFFFFFFFFFFFF")
  const phaseId = num >> 64n
  const aggregatorRoundId = num & num2
  const currentRound = (phaseId << 64n) | (aggregatorRoundId)
  

  // If we have no history, we need to get benchmark data to estimate rounds per day
  if (initialHistoryLength === 0) {
    contract.history = []
    console.log('No history, initializing with endpoints', contract.assetName?.length ? contract.assetName : contract.name)
    
    // Get benchmark point to calculate time per round
    const benchRoundData = await fetchHistoryPoint(contract, currentRound - 100n)
    if (!benchRoundData || Number(benchRoundData.answer) <= 0) {
      console.log('Failed to get benchmark data, aborting', contract.assetName?.length ? contract.assetName : contract.name)
      return
    }
    
    // Calculate approximate rounds per day
    const timePerRound = (contract.timestamp - Number(benchRoundData.updatedAt + '000'))/100
    const roundsPerDay = Math.ceil(86400000 / timePerRound)
    
    // Target round from 24h ago
    const dayOldTargetRound = currentRound - BigInt(roundsPerDay)
    
    // Fetch endpoints first: now and 24h ago
    const currentData = await fetchHistoryPoint(contract, currentRound)
    const dayOldData = await fetchHistoryPoint(contract, dayOldTargetRound)
    
    if (currentData) contract.history.push(currentData)
    if (dayOldData) contract.history.push(dayOldData)
    
    // Sort
    if (contract.history.length > 0) {
      contract.history.sort((a, b) => Number(a.updatedAt) - Number(b.updatedAt))
      
      // Store the roundsPerDay for future reference
      contract.roundsPerDay = roundsPerDay
    }
  } else {
    // Try to add current point at the end of history
    const currentData = {
      roundId: contract.roundId,
      answer: contract.price,
      startedAt: Math.floor(contract.timestamp / 1000).toString(),
      updatedAt: Math.floor(contract.timestamp / 1000).toString(),
      answeredInRound: contract.roundId
    }

    const lastPoint = contract.history.length > 0 ? contract.history[contract.history.length - 1] : null

    if ((!lastPoint || lastPoint.roundId !== currentData.roundId) && (!lastPoint || (Number(currentData.updatedAt) - Number(lastPoint.updatedAt)) > GAP_TIME)) {
      // Add the current point to the history if it is not the same as the last one or if there is a gap of more than GAP_TIME seconds between them 
      contract.history.push(currentData)
      contract.history.sort((a, b) => Number(a.updatedAt) - Number(b.updatedAt))
    }
  }
  
  // Check for gaps in history
  const gaps = findGapsInHistory(contract.history)
  
  // Start a background process to fill gaps using dichotomy
  setTimeout(() => {
    fillHistoryGaps(contract, gaps)
  }, 400)
  
  // Calculate statistics from what we have
  if (contract.history.length > 0) {
    contract.averagePrice = contract.history.reduce((acc, val) => acc + Number(val.answer), 0) / contract.history.length
    
    // Sort by timestamp
    contract.history.sort((a, b) => Number(a.updatedAt) - Number(b.updatedAt))
    
    // Filter to keep only 24h data
    const oneDayAgo = Date.now()/1000 - 86400
    const index = contract.history.findIndex(p => Number(p.updatedAt) > oneDayAgo) - 1
    if (index > 0) {
      contract.history = contract.history.slice(index)
    }
    
    // Calculate 24h percentage change if we have enough data
    if (contract.history[0]?.answer) {
      contract.percentChange24h = (Number(contract.price) - Number(contract.history[0].answer)) / Number(contract.history[0].answer) * 100
    }
    
    // Update UI with what we have so far
    updateScreenerByContract(contract)
  }
}











const fillHistoryGaps = async (contract, gaps) => {
  // Stop conditions
  if (!gaps || gaps.length === 0) return
  
  // Process the largest gap first
  gaps.sort((a, b) => b.timeDiff - a.timeDiff)
  const largestGap = gaps[0]

  // Process gaps larger than GAP_TIME
  if(largestGap.timeDiff < GAP_TIME) return
  
  // Calculate the middle point's roundId
  const midRoundId = largestGap.startRoundId + ((largestGap.endRoundId - largestGap.startRoundId) / 2n)
  
  // Cannot find inbetween point, stop the dichotomy
  if(midRoundId === largestGap.startRoundId || midRoundId === largestGap.endRoundId) return

  // Fetch the middle point
  const midPointData = await fetchHistoryPoint(contract, midRoundId)
  
  if (midPointData && Number(midPointData.answer) > 0) {
    // Add the new midpoint to history
    const isDuplicate = contract.history.some(point => point.roundId === midPointData.roundId)
    if (!isDuplicate) {
      contract.history.push(midPointData)
      
      // Sort by timestamp
      contract.history.sort((a, b) => Number(a.updatedAt) - Number(b.updatedAt))
      
      // Calculate new statistics
      contract.averagePrice = contract.history.reduce((acc, val) => acc + Number(val.answer), 0) / contract.history.length

      const oldestPoint = contract.history[0]
      if (oldestPoint?.answer) {
        contract.percentChange24h = (Number(contract.price) - Number(oldestPoint.answer)) / Number(oldestPoint.answer) * 100
      }

      // Update UI immediately
      updateScreenerByContract(contract)
    }
    
    // Find new gaps after adding this point
    const newGaps = findGapsInHistory(contract.history)
    
    // Continue filling gaps asynchronously
    setTimeout(() => {
      fillHistoryGaps(contract, newGaps)
    }, 400)
  } else {
    // If middle point fetch failed, remove this gap and try others
    const remainingGaps = gaps.slice(1)
    
    // Continue with other gaps
    setTimeout(() => {
      fillHistoryGaps(contract, remainingGaps)
    }, 400)
  }
}

const findGapsInHistory = (history, minTimeDiff = GAP_TIME) => {
  if(!history) return []

  // Sort history by timestamp to ensure proper gap detection
  const sortedHistory = [...history].sort((a, b) => Number(a.updatedAt) - Number(b.updatedAt))
  const gaps = []
  
  for (let i = 0; i < sortedHistory.length - 1; i++) {
    const currentTime = Number(sortedHistory[i].updatedAt)
    const nextTime = Number(sortedHistory[i + 1].updatedAt)
    const timeDiff = nextTime - currentTime
    
    // If time gap is significant, add to gaps list
    if (timeDiff > minTimeDiff) {
      gaps.push({
        startIndex: i,
        endIndex: i + 1,
        startTime: currentTime,
        endTime: nextTime,
        startRoundId: BigInt(sortedHistory[i].roundId),
        endRoundId: BigInt(sortedHistory[i + 1].roundId),
        timeDiff
      })
    }
  }
  
  return gaps
}

const fetchHistoryPoint = async (contract, roundId) => {
  try {
    // console.log(`Fetching history for ${contract.assetName} at round ${roundId}`)
    const roundData = await getRoundDataWeb3(contract.proxyAddress, roundId, contract.networkId)

    if (!roundData) {
      console.warn(`No data returned for ${contract.assetName} at round ${roundId}`)
      return null
    }

    if (Number(roundData.answer) <= 0) {
      console.warn(`Invalid price (${roundData.answer}) for ${contract.assetName} at round ${roundId}`)
      return null
    }

    // console.log(`Successfully fetched history point for ${contract.assetName}: round=${roundId}, price=${roundData.answer}, time=${new Date(Number(roundData.updatedAt + '000')).toISOString()}`)
    return roundData
  } catch (e) {
    console.log(`Error fetching history for ${contract.assetName} at round ${roundId}:`, e.message)
  }
  return null
}


// Add a function to check if history needs repair
const repairHistoryIfNeeded = (contract) => {
  if (!contract || !contract.history) return false
  
  // Check for invalid data points
  const validHistory = contract.history.filter(point => 
    point && point.answer && Number(point.answer) > 0 && 
    point.updatedAt && Number(point.updatedAt) > 0
  )
  
  // If we lost data, update the history
  if (validHistory.length < contract.history.length) {
    contract.history = validHistory
    return true
  }
  
  return false
}

// Add this at the end of updateHistory to ensure no duplicates
const removeDuplicateHistoryPoints = (contract) => {
  if (!contract || !contract.history) return
  
  // Get unique roundIds
  const uniqueRoundIds = new Set()
  const uniqueHistory = []
  
  for (const point of contract.history) {
    if (!uniqueRoundIds.has(point.roundId)) {
      uniqueRoundIds.add(point.roundId)
      uniqueHistory.push(point)
    }
  }
  
  if (uniqueHistory.length < contract.history.length) {
    contract.history = uniqueHistory
  }
}


















const addToScreener = async (e) => {
  if (!e.target?.id && e.target?.parentElement) e = e.target.parentElement
  if (e.target?.id) e = e.target

  if (isInScreener(e.id)) return

  const contract = searchContract(e.id)
  if(!contract) return
  screener.push(contract)
  updateScreener()
  updatePrice(contract)
}

const addToDetails = async (contract) => {
  document.getElementById('details-assetName').innerHTML = contract.assetName?.length ? contract.assetName : contract.name
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
      { stroke: "ghostwhite", curve: "monotone-x" }).plot({ height: window.innerHeight - 80, width: window.innerWidth, axis: null });
    divGraph.append(plot)
  }
}

const removeFromScreener = async (e) => {
  if (e.target.tagName.toLowerCase() !== 'li') e = e.target.parentElement
  if (e.target?.id) e = e.target

  if (isInScreener(e.id)) {
    const contract = screener.find(
      (contract) => contract && e.id.split('+')[0].includes(contract.networkId) && contract.path === e.id.split('+')[1]
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
      (contract) => contract && id.split('+')[0].includes(contract.networkId) && contract.path === id.split('+')[1]
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
  .then((str) => {
    return ('{ data:' + str + '}')
    .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ')
    .replaceAll('https": ', 'https:')
    .replace(/\,(?!\s*?[\{\[\"\'\w])/g, '')
  })
  .then(JSON.parse)
  .then((json) => json.data)
  .catch((reason) => console.error('fetchPages failed: ', reason))

  // Keep only mainnets
  list.forEach(page => {
    page.networks = page.networks.filter(({ networkType }) => networkType === 'mainnet')
    if(!page.networks) return

    const key = CHAINS_TO_ID.map(chain => Object.keys(chain.chains).find(key => key.toLocaleLowerCase().replace('_','-') === page.networks[0]?.queryString)).find(c => c)
    const chainInfos = CHAINS_TO_ID.find(chain => chain.chains[key])?.chains[key]
    if(!chainInfos) return
    
    const infos = CHAINS_TO_RPC.find(({ chainId }) => chainId === chainInfos?.chainId)
    infos.rpc = infos?.rpc?.filter(rpc => rpc.startsWith('http') && !rpc.includes('API'))

    Object.assign(page, infos)
  })

  pages = list

  console.log('Pages:', pages)

  // Initialize or update web3 with page.rpc URLs
  pages.forEach(page => {
    if(page.rpc && page.rpc.length > 0) {
      page.networks.forEach(network => {
        const networkId = page.page + '.' + network.name.toLowerCase().replaceAll(' ', '-')
        rpcIndexes[networkId] = 0
        web3[networkId] = new Web3(page.rpc[0])
      })
    }
  })

  await populateContracts()

  localStorage.setItem('pages', JSON.stringify(pages))
}

const fetchContracts = async (url) => {
  const data = await fetch(url)
  .then((resp) => resp.text())
  .then(JSON.parse)
  .then((array) => array.sort((a, b) => a.name.localeCompare(b.name)))
  .catch((reason) => console.error(url, 'fetchContracts failed: ', reason))
  return data || []
}


// Swith RPC
const switchToNextRPC = async (networkId) => {
  const page = pages.find(page => page.networks.some(network => 
    networkId === page.page + '.' + network.name.toLowerCase().replaceAll(' ', '-')
  ))
  
  if(!page || !page.rpc || page.rpc.length <= 1) return false
  
  // Increment the RPC index, cycling back to 0 if we reach the end
  const currentRPC = page.rpc[rpcIndexes[networkId]]
  rpcIndexes[networkId] = (rpcIndexes[networkId] + 1) % page.rpc.length
  
  try {
    console.log(`RPC ${currentRPC} failure, Switching ${networkId} to #${rpcIndexes[networkId]}: ${page.rpc[rpcIndexes[networkId]]}`)
    web3[networkId] = new Web3(page.rpc[rpcIndexes[networkId]])
    return true
  } catch(e) {
    console.error(`Failed to switch to RPC #${rpcIndexes[networkId]} for ${networkId}`, e)
    return false
  }
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
  const maxAttempts = 3 // Try up to 3 different RPCs
  let attempts = 0

  while(attempts < maxAttempts) {
    const web3Instance = getWeb3(network)
    if(!web3Instance) return
    
    try {
      let contract = new (web3Instance.eth).Contract(ABI, adress)
      const result = await contract.methods.latestRoundData().call()
      return result
    } catch(error) {
      attempts++
      // console.warn(`RPC failed for ${network}, attempt ${attempts}/${maxAttempts}`, error)
      
      // If we haven't reached max attempts, try switching to the next RPC
      if(attempts < maxAttempts) {
        const switched = await switchToNextRPC(network)
        if(!switched) break // No more RPCs to try
      }
    }
  }
  
  console.error(`All RPCs failed for ${network} after ${attempts} attempts`)
  return null
}

// Get historical price
const getRoundDataWeb3 = async (adress, roundId, network) => {
  const maxAttempts = 3 // Try up to 3 different RPCs
  let attempts = 0
  
  while(attempts < maxAttempts) {
    const web3Instance = getWeb3(network)
    if(!web3Instance) return
    
    try {
      let contract = new (web3Instance.eth).Contract(ABI, adress)
      const result = await contract.methods.getRoundData(roundId).call()
      return result
    } catch(error) {
      attempts++
      // console.warn(`RPC failed for ${network} with roundId ${roundId}, attempt ${attempts}/${maxAttempts}`, error)
      
      // If we haven't reached max attempts, try switching to the next RPC
      if(attempts < maxAttempts) {
        const switched = await switchToNextRPC(network)
        if(!switched) break // No more RPCs to try
      }
    }
  }
  
  console.error(`All RPCs failed for ${network} with roundId ${roundId} after ${attempts} attempts`)
  return null
}
