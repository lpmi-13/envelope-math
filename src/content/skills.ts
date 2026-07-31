import type { SkillDefinition } from '../domain/types'

export const skills: SkillDefinition[] = [
  {
    id: 'foundations',
    number: '01',
    shortName: 'Foundations',
    title: 'Make the numbers friendly',
    description: 'Round aggressively, keep the units visible, and work in powers of ten.',
    outcome: 'Turn awkward quantities into useful mental estimates.',
    reference: [
      '1 day = 86,400 seconds ≈ 100,000',
      '8 bits = 1 byte',
      'kilo = 10³ · mega = 10⁶ · giga = 10⁹',
      'For interviews, use decimal units unless told otherwise.',
    ],
    workedExample: {
      title: 'Events per day → events per second',
      prompt: 'A service receives 500 million events each day. What is its average event rate?',
      steps: [
        { label: 'Round time', value: '86,400 seconds/day ≈ 100,000 (10⁵)' },
        { label: 'Write powers', value: '500 million = 5 × 10⁸' },
        { label: 'Divide', value: '(5 × 10⁸) ÷ 10⁵ = 5 × 10³' },
        { label: 'Estimate', value: '≈ 5,000 events/second' },
      ],
      takeaway: 'Dividing a daily count by 100,000 gives a fast average-per-second estimate.',
    },
  },
  {
    id: 'load',
    number: '02',
    shortName: 'Load',
    title: 'Find the busy second',
    description: 'Move from users and daily behaviour to average and peak request rates.',
    outcome: 'Estimate average and peak requests per second.',
    reference: [
      'Average RPS = daily requests ÷ seconds/day',
      'Peak RPS = average RPS × peak multiplier',
      'Separate reads and writes when they scale differently.',
      'State whether “users” means registered, active, or concurrent.',
    ],
    workedExample: {
      title: 'A posting workload',
      prompt: '100 million daily users each create 10 posts. Estimate average write RPS.',
      steps: [
        { label: 'Daily writes', value: '100M × 10 = 1B posts/day' },
        { label: 'Round time', value: '1 day ≈ 100,000 seconds' },
        { label: 'Average', value: '1B ÷ 100K = 10K writes/second' },
        { label: 'Sanity check', value: 'Exact is 11.6K, so 10K is the right scale' },
      ],
      takeaway: 'Average load is a baseline. Apply an explicit peak factor before sizing.',
    },
  },
  {
    id: 'storage',
    number: '03',
    shortName: 'Storage',
    title: 'Follow every stored byte',
    description: 'Combine object counts, object sizes, retention, and copies.',
    outcome: 'Estimate daily and retained storage footprints.',
    reference: [
      'Storage = objects × bytes/object × retention',
      'Include replicas, indexes, and metadata when relevant.',
      '1 GB = 10⁹ bytes · 1 TB = 10¹² bytes',
      '1 GiB = 2³⁰ bytes; do not silently mix GB and GiB.',
    ],
    workedExample: {
      title: 'A day of photo uploads',
      prompt: '500 million users upload two 2 MB photos per day.',
      steps: [
        { label: 'Photos', value: '500M × 2 = 1B photos/day' },
        { label: 'Bytes', value: '1B × 2 MB = 2B MB' },
        { label: 'Convert', value: '1B MB = 1 PB, so 2B MB = 2 PB' },
        { label: 'Estimate', value: '≈ 2 PB/day before replication' },
      ],
      takeaway: 'Name whether the result is raw storage or includes operational copies.',
    },
  },
  {
    id: 'bandwidth',
    number: '04',
    shortName: 'Bandwidth',
    title: 'Move bytes through time',
    description: 'Estimate ingress and egress while keeping bits and bytes straight.',
    outcome: 'Turn traffic and payload sizes into network throughput.',
    reference: [
      'Bandwidth = transfers/second × bytes/transfer',
      'Network rates are normally expressed in bits/second.',
      'Bytes/second × 8 = bits/second',
      'Streaming load uses concurrent viewers, not total users.',
    ],
    workedExample: {
      title: 'Video egress',
      prompt: 'Two million concurrent viewers each receive a 4 Mbps stream.',
      steps: [
        { label: 'Concurrency', value: '2 million active streams' },
        { label: 'Per stream', value: '4 megabits/second' },
        { label: 'Multiply', value: '2M × 4 Mbps = 8M Mbps' },
        { label: 'Convert', value: '8M Mbps = 8 Tbps' },
      ],
      takeaway: 'The concurrency assumption often matters more than arithmetic precision.',
    },
  },
  {
    id: 'latency',
    number: '05',
    shortName: 'Latency',
    title: 'Trace the critical path',
    description: 'Distinguish sequential work from parallel work and find what users wait for.',
    outcome: 'Estimate end-to-end response time from component latencies.',
    reference: [
      'Sequential latency = sum of every dependency',
      'Parallel latency = the slowest required branch',
      'Add serial work before and after parallel branches.',
      'Published latency numbers are anchors, not timeless guarantees.',
    ],
    workedExample: {
      title: 'Three downstream services',
      prompt: 'An API calls services taking 50 ms, 100 ms, and 200 ms.',
      steps: [
        { label: 'Sequential', value: '50 + 100 + 200 = 350 ms' },
        { label: 'Parallel', value: 'max(50, 100, 200) = 200 ms' },
        { label: 'Difference', value: 'Parallel execution saves about 150 ms' },
        { label: 'Caveat', value: 'Only independent calls can be parallelised' },
      ],
      takeaway: 'Draw the dependency path before reaching for arithmetic.',
    },
  },
  {
    id: 'compute',
    number: '06',
    shortName: 'Compute',
    title: 'Turn work into cores',
    description: 'Translate request rate and CPU time into capacity with realistic headroom.',
    outcome: 'Estimate core demand and adjust for target utilisation.',
    reference: [
      'Cores at 100% = RPS × CPU seconds/request',
      '10 ms = 0.01 CPU seconds',
      'Provisioned cores = raw cores ÷ target utilisation',
      'CPU time is not the same as wall-clock request latency.',
    ],
    workedExample: {
      title: 'CPU for an API',
      prompt: 'An API handles 10,000 RPS and spends 10 ms of CPU per request.',
      steps: [
        { label: 'CPU work', value: '10,000 × 10 ms = 100,000 ms/second' },
        { label: 'Convert', value: '100,000 ms = 100 CPU-seconds' },
        { label: 'Raw capacity', value: '100 CPU-seconds/second = 100 cores' },
        { label: 'Headroom', value: 'At 50% target utilisation, provision 200 cores' },
      ],
      takeaway: 'Always state whether your answer is raw demand or provisioned capacity.',
    },
  },
]

export const skillsById = Object.fromEntries(
  skills.map((skill) => [skill.id, skill]),
) as Record<SkillDefinition['id'], SkillDefinition>
