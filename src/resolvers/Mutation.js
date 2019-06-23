import bcrypt from "bcryptjs"
import generateToken from "../utils/generateToken"
import getUserId from "../utils/getUserId"
import hashPassword from "../utils/hashPassword"
import {
	addFragmentToInfo
} from "graphql-binding";

const Mutation = {
	async createUser(parent, args, {
		prisma
	}, info) {
		const {
			data
		} = args

		const emailTaken = await prisma.exists.User({
			email: data.email
		})

		const cpfTaken = await prisma.exists.User({
			cpf: data.cpf
		})

		if (emailTaken || cpfTaken) {
			throw new Error("Email ou cpf já registrados.")
		}

		const password = await hashPassword(data.password)
		const user = await prisma.mutation.createUser({
			data: {
				...data,
				password
			}
		})

		return {
			user,
			token: generateToken(user.id)
		}
	},
	async loginUser(parent, args, {
		prisma
	}, info) {
		const {
			data
		} = args
		const user = await prisma.query.user({
			where: {
				OR: [{
						email: data.info
					},
					{
						cpf: data.info
					}
				]
			}
		})

		if (!user) {
			throw new Error("Desculpe. Não foi possível logar.")
		}

		const isMatch = await bcrypt.compare(data.password, user.password)

		if (!isMatch) {
			throw new Error("Desculpe. Não foi possível logar.")
		}

		return {
			user,
			token: generateToken(user.id)
		}
	},
	async deleteUser(parent, args, {
		prisma,
		request
	}, info) {
		const userId = getUserId(request)

		return prisma.mutation.deleteUser({
				where: {
					id: userId
				}
			},
			info
		)
	},
	async updateUser(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args

		const userId = getUserId(request)

		if (typeof data.password === "string") {
			data.password = await hashPassword(data.password)
		}

		return prisma.mutation.updateUser({
				where: {
					id: userId
				},
				data
			},
			info
		)
	},
	async createRaffle(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const costEachTicket = 0.1
		const userId = getUserId(request)

		return prisma.mutation.createUserRaffle({
			user: {
				connect: {
					id: userId
				}
			},
			raffleRole: 'ADMIN',
			raffle: {
				create: {
					size: data.size,
					drawDate: data.drawDate,
					price: data.price,
					isPaid: false,
					totalCost: data.size * costEachTicket,
					prizes: {
						create: {
							prizeNumber: data.prize.prizeNumber,
							prize: data.prize.prize,
							description: data.prize.description,
						}
					}
				}
			}
		})
	},
	async createPrize(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserId(request)
		const raffleId = args.id

		const isRaffleAdmin = await prisma.query.userRaffle({
			where: {
				AND: [{
						user: userId
					},
					{
						raffle: raffleId
					},
					{
						userRole: 'ADMIN'
					}
				]
			}
		})

		if (!isRaffleAdmin) {
			throw new Error('You cannot edit this raffle.')
		}

		const prizeNumberExists = await prisma.query.prize({
			where: {
				AND: [{
						raffle: raffleId
					},
					{
						prizeNumber: data.prizeNumber
					}
				]
			}
		})

		if (prizeNumberExists) {
			throw new Error('Prize number already registered for this raffle.')
		}

		return prisma.mutation.createPrize({
			...data,
			raffle: {
				connect: {
					id: raffleId
				}
			}
		})

	},
	async updatePrize(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserId(request)
		const prizeId = args.id

		const prizeExists = await prisma.exists.prize({
			id: args.id
		})
		if (!prizeExists) {
			throw new Error('Prize not found.')
		}

		const isRaffleAdmin = await prisma.query.userRaffle({
			where: {
				AND: [{
						user: userId
					},
					{
						raffle: raffleId
					},
					{
						userRole: 'ADMIN'
					}
				]
			}
		})

		if (!isRaffleAdmin) {
			throw new Error('You cannot edit this raffle.')
		}

		const prizeNumberExists = await prisma.query.prize({
			where: {
				AND: [{
						raffle: raffleId
					},
					{
						prizeNumber: data.prizeNumber
					}
				]
			}
		})

		if (prizeNumberExists) {
			throw new Error('Prize number already registered for this raffle.')
		}

		return prisma.mutation.createPrize({
			...data,
			raffle: {
				connect: {
					id: raffleId
				}
			}
		})

	},
	async createUserRaffle(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserId(request)
		const raffleId = args.id
		const idUserToAdd = args.userId

		//MUST CHECK IF USER IS ADMIN
		const isRaffleAdmin = await prisma.query.userRaffle({
			where: {
				AND: [{
						user: userId
					},
					{
						raffle: raffleId
					},
					{
						userRole: 'ADMIN'
					}
				]
			}
		})

		if (!isRaffleAdmin) {
			throw new Error('You cannot edit this raffle.')
		}

		const isUserAdded = await prisma.query.userRaffle({
			where: {
				AND: [{
						user: idUserToAdd
					},
					{
						raffle: raffleId
					}
				]
			}
		})

		if (isUserAdded) {
			throw new Error('User already added to this raffle.')
		}

		return prisma.mutation.createUserRaffle({
			user: {
				connect: {
					id: idUserToAdd
				}
			},
			raffleRole: data.userRole,
			raffle: {
				connect: {
					id: raffleId
				}
			}
		})
	},
	async updateUserRaffle(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserId(request)
		const raffleId = 'RAFFLE ID MUST COME FROM THE REQUEST'

		return prisma.mutation.createUserRaffle({
			user: {
				connect: {
					id: data.userId
				}
			},
			raffleRole: data.userRole,
			raffle: {
				connect: {
					id: raffleId
				}
			}
		})
	},
}

export {
	Mutation as
	default
}