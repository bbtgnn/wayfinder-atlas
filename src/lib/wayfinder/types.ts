import type { Node } from '@xyflow/svelte'
import type { Ticket } from '../../projection/types'

export type TicketNodeData = {
	ticket: Ticket
	frontier: boolean
	blocked: boolean
}

export type TicketFlowNode = Node<TicketNodeData, 'ticket'>
