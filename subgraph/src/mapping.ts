import {
  WorkerRegistered,
  WorkerVerified,
  JobCreated,
  JobAssigned,
  JobCompleted,
  ReputationUpdated
} from "../generated/JobRegistry/JobRegistry"
import {
  Worker,
  Job,
  ReputationHistory,
  JobEvent,
  DailyStats,
  GlobalStats
} from "../generated/schema"
import { BigInt, Bytes, log } from "@graphprotocol/graph-ts"

// Helper function to combine CID parts
function combineCidParts(part1: string, part2: string | null): string {
  if (part2 === null || part2 === "") {
    return part1
  }
  return part1 + part2
}

// Helper function to get or create daily stats
function getOrCreateDailyStats(timestamp: BigInt): DailyStats {
  let dayTimestamp = timestamp.div(BigInt.fromI32(86400)).times(BigInt.fromI32(86400))
  let dayId = dayTimestamp.toString()
  
  let stats = DailyStats.load(dayId)
  if (stats === null) {
    stats = new DailyStats(dayId)
    stats.date = dayTimestamp
    stats.jobsCreated = BigInt.fromI32(0)
    stats.jobsCompleted = BigInt.fromI32(0)
    stats.totalReward = BigInt.fromI32(0)
    stats.averageQuality = BigDecimal.fromString("0")
    stats.activeWorkers = BigInt.fromI32(0)
    stats.newWorkers = BigInt.fromI32(0)
    stats.workersVerified = BigInt.fromI32(0)
    stats.totalTransactions = BigInt.fromI32(0)
    stats.averageReputation = BigDecimal.fromString("500")
    stats.save()
  }
  
  return stats
}

// Helper function to get or create global stats
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global")
  if (stats === null) {
    stats = new GlobalStats("global")
    stats.totalWorkers = BigInt.fromI32(0)
    stats.totalVerifiedWorkers = BigInt.fromI32(0)
    stats.totalJobs = BigInt.fromI32(0)
    stats.totalCompletedJobs = BigInt.fromI32(0)
    stats.totalRewards = BigInt.fromI32(0)
    stats.averageReputation = BigDecimal.fromString("500")
    stats.averageQualityScore = BigDecimal.fromString("0")
    stats.averageJobReward = BigDecimal.fromString("0")
    stats.openJobs = BigInt.fromI32(0)
    stats.assignedJobs = BigInt.fromI32(0)
    stats.activeWorkers = BigInt.fromI32(0)
    stats.lastUpdated = BigInt.fromI32(0)
    stats.save()
  }
  return stats
}

export function handleWorkerRegistered(event: WorkerRegistered): void {
  let worker = new Worker(event.params.worker.toHexString())
  
  worker.address = event.params.worker
  worker.registered = true
  worker.registeredAt = event.block.timestamp
  worker.infoCidPart1 = event.params.info_cid_part1.toString()
  worker.infoCidPart2 = event.params.info_cid_part2.toString()
  worker.fullInfoCid = combineCidParts(
    event.params.info_cid_part1.toString(),
    event.params.info_cid_part2.toString()
  )
  
  // Initialize worker stats
  worker.verified = false
  worker.reputation = BigInt.fromI32(500) // Default reputation
  worker.jobsCompleted = BigInt.fromI32(0)
  worker.jobsAssigned = BigInt.fromI32(0)
  worker.totalEarnings = BigInt.fromI32(0)
  worker.lastSeen = event.block.timestamp
  worker.createdAt = event.block.timestamp
  worker.updatedAt = event.block.timestamp
  
  worker.save()
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp)
  dailyStats.newWorkers = dailyStats.newWorkers.plus(BigInt.fromI32(1))
  dailyStats.save()
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.totalWorkers = globalStats.totalWorkers.plus(BigInt.fromI32(1))
  globalStats.lastUpdated = event.block.timestamp
  globalStats.save()
  
  log.info("Worker registered: {}", [event.params.worker.toHexString()])
}

export function handleWorkerVerified(event: WorkerVerified): void {
  let worker = Worker.load(event.params.worker.toHexString())
  if (worker === null) {
    log.error("Worker not found for verification: {}", [event.params.worker.toHexString()])
    return
  }
  
  worker.verified = true
  worker.verifiedAt = event.block.timestamp
  worker.verifiedBy = event.params.verifier
  worker.updatedAt = event.block.timestamp
  worker.save()
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp)
  dailyStats.workersVerified = dailyStats.workersVerified.plus(BigInt.fromI32(1))
  dailyStats.save()
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.totalVerifiedWorkers = globalStats.totalVerifiedWorkers.plus(BigInt.fromI32(1))
  globalStats.lastUpdated = event.block.timestamp
  globalStats.save()
  
  log.info("Worker verified: {} by {}", [
    event.params.worker.toHexString(),
    event.params.verifier.toHexString()
  ])
}

export function handleJobCreated(event: JobCreated): void {
  let job = new Job(event.params.job_id.toString())
  
  job.chainJobId = event.params.job_id
  job.creator = event.params.creator
  job.reward = event.params.reward
  job.deadline = event.params.deadline
  
  // These would need to be fetched from contract state or additional event data
  job.assetCidPart1 = "" // Would need contract call or additional event data
  job.fullAssetCid = ""
  job.minReputation = BigInt.fromI32(400) // Default or from contract
  
  job.completed = false
  job.status = "OPEN"
  job.createdAt = event.block.timestamp
  job.updatedAt = event.block.timestamp
  
  job.save()
  
  // Create job event
  let jobEvent = new JobEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  jobEvent.job = job.id
  jobEvent.eventType = "CREATED"
  jobEvent.actor = event.params.creator
  jobEvent.transactionHash = event.transaction.hash
  jobEvent.blockNumber = event.block.number
  jobEvent.timestamp = event.block.timestamp
  jobEvent.data = `{"reward": "${event.params.reward.toString()}", "deadline": "${event.params.deadline.toString()}"}`
  jobEvent.save()
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp)
  dailyStats.jobsCreated = dailyStats.jobsCreated.plus(BigInt.fromI32(1))
  dailyStats.totalReward = dailyStats.totalReward.plus(event.params.reward)
  dailyStats.save()
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.totalJobs = globalStats.totalJobs.plus(BigInt.fromI32(1))
  globalStats.openJobs = globalStats.openJobs.plus(BigInt.fromI32(1))
  globalStats.totalRewards = globalStats.totalRewards.plus(event.params.reward)
  globalStats.lastUpdated = event.block.timestamp
  globalStats.save()
  
  log.info("Job created: {} by {} with reward {}", [
    event.params.job_id.toString(),
    event.params.creator.toHexString(),
    event.params.reward.toString()
  ])
}

export function handleJobAssigned(event: JobAssigned): void {
  let job = Job.load(event.params.job_id.toString())
  if (job === null) {
    log.error("Job not found for assignment: {}", [event.params.job_id.toString()])
    return
  }
  
  let worker = Worker.load(event.params.worker.toHexString())
  if (worker === null) {
    log.error("Worker not found for job assignment: {}", [event.params.worker.toHexString()])
    return
  }
  
  job.assignedWorker = worker.id
  job.assignedAt = event.block.timestamp
  job.status = "ASSIGNED"
  job.updatedAt = event.block.timestamp
  job.save()
  
  // Update worker stats
  worker.jobsAssigned = worker.jobsAssigned.plus(BigInt.fromI32(1))
  worker.lastSeen = event.block.timestamp
  worker.updatedAt = event.block.timestamp
  worker.save()
  
  // Create job event
  let jobEvent = new JobEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  jobEvent.job = job.id
  jobEvent.eventType = "ASSIGNED"
  jobEvent.actor = event.params.worker
  jobEvent.transactionHash = event.transaction.hash
  jobEvent.blockNumber = event.block.number
  jobEvent.timestamp = event.block.timestamp
  jobEvent.data = `{"worker": "${event.params.worker.toHexString()}"}`
  jobEvent.save()
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.openJobs = globalStats.openJobs.minus(BigInt.fromI32(1))
  globalStats.assignedJobs = globalStats.assignedJobs.plus(BigInt.fromI32(1))
  globalStats.lastUpdated = event.block.timestamp
  globalStats.save()
  
  log.info("Job assigned: {} to worker {}", [
    event.params.job_id.toString(),
    event.params.worker.toHexString()
  ])
}

export function handleJobCompleted(event: JobCompleted): void {
  let job = Job.load(event.params.job_id.toString())
  if (job === null) {
    log.error("Job not found for completion: {}", [event.params.job_id.toString()])
    return
  }
  
  job.completed = true
  job.completedAt = event.block.timestamp
  job.qualityScore = event.params.quality_score
  job.status = "COMPLETED"
  job.updatedAt = event.block.timestamp
  job.save()
  
  // Update worker stats if assigned
  if (job.assignedWorker !== null) {
    let worker = Worker.load(job.assignedWorker!)
    if (worker !== null) {
      worker.jobsCompleted = worker.jobsCompleted.plus(BigInt.fromI32(1))
      worker.totalEarnings = worker.totalEarnings.plus(job.reward)
      worker.lastSeen = event.block.timestamp
      worker.updatedAt = event.block.timestamp
      worker.save()
    }
  }
  
  // Create job event
  let jobEvent = new JobEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  jobEvent.job = job.id
  jobEvent.eventType = "COMPLETED"
  jobEvent.transactionHash = event.transaction.hash
  jobEvent.blockNumber = event.block.number
  jobEvent.timestamp = event.block.timestamp
  jobEvent.data = `{"quality_score": "${event.params.quality_score.toString()}"}`
  jobEvent.save()
  
  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp)
  dailyStats.jobsCompleted = dailyStats.jobsCompleted.plus(BigInt.fromI32(1))
  dailyStats.save()
  
  // Update global stats
  let globalStats = getOrCreateGlobalStats()
  globalStats.totalCompletedJobs = globalStats.totalCompletedJobs.plus(BigInt.fromI32(1))
  globalStats.assignedJobs = globalStats.assignedJobs.minus(BigInt.fromI32(1))
  globalStats.lastUpdated = event.block.timestamp
  globalStats.save()
  
  log.info("Job completed: {} with quality score {}", [
    event.params.job_id.toString(),
    event.params.quality_score.toString()
  ])
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  let worker = Worker.load(event.params.worker.toHexString())
  if (worker === null) {
    log.error("Worker not found for reputation update: {}", [event.params.worker.toHexString()])
    return
  }
  
  // Create reputation history entry
  let historyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let history = new ReputationHistory(historyId)
  
  history.worker = worker.id
  history.oldReputation = event.params.old_reputation
  history.newReputation = event.params.new_reputation
  history.changeAmount = event.params.new_reputation.minus(event.params.old_reputation)
  history.reason = event.params.reason.toString()
  history.transactionHash = event.transaction.hash
  history.blockNumber = event.block.number
  history.timestamp = event.block.timestamp
  
  history.save()
  
  // Update worker reputation
  worker.reputation = event.params.new_reputation
  worker.updatedAt = event.block.timestamp
  worker.save()
  
  log.info("Reputation updated for worker {}: {} -> {}", [
    event.params.worker.toHexString(),
    event.params.old_reputation.toString(),
    event.params.new_reputation.toString()
  ])
}
