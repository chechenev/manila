import rawSeedData from './seed/refund-workbench-data.json'
import { refundWorkbenchDataSchema } from '../domain/schemas.ts'

export const refundWorkbenchSeedData = refundWorkbenchDataSchema.parse(rawSeedData)
