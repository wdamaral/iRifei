import bcrypt from "bcryptjs"
import generateToken from "../utils/generateToken"
import getUserId from "../utils/getUserId"
import hashPassword from "../utils/hashPassword"
import isRaffleAdmin from '../utils/isRaffleAdmin'

import {
	addFragmentToInfo
} from "graphql-binding"


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

		const user = await prisma.query.users({
			where: {
				OR: [{
						cpf: data.info
					},
					{
						email: data.info
					}
				]
			}
		})

		if (user.length === 0) {
			throw new Error("Desculpe. Não foi possível logar.")
		}

		const isMatch = await bcrypt.compare(data.password, user[0].password)

		if (!isMatch) {
			throw new Error("Desculpe. Não foi possível logar.")
		}

		return {
			user: user[0],
			token: generateToken(user[0].id)
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
			data: {
				raffleRole: 'ADMIN',
				user: {
					connect: {
						id: userId
					}
				},
				raffle: {
					create: {
						size: data.size,
						drawDate: data.drawDate,
						price: data.price,
						isPaid: false,
						totalCost: data.size * costEachTicket,
						prizes: {
							create: {
								prizeNumber: data.prizes.prizeNumber,
								prize: data.prizes.prize,
								description: data.prizes.description
							}
						}
					}
				}
			}
		}, info)
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

		//fails if not admin
		isRaffleAdmin(userId, raffleId)

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
			throw new Error("Prize number already registered for this raffle.")
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

		const prizeExists = await prisma.exists.prize({
			id: args.id
		})
		if (!prizeExists) {
			throw new Error("Prize not found.")
		}

		//fails if not admin
		isRaffleAdmin(userId, raffleId)

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
			throw new Error("Prize number already registered for this raffle.")
		}

		return prisma.mutation.createPrize({
			...data,
			raffle: {
				connect: {
					id: raffleId
				}
			}
		}, info)
	},
	async deletePrize(parent, args, {
		prisma,
		request
	}, info) {
		const {
			id,
			raffleId
		} = args
		const userId = getUserId(request)

		//fails if not admin
		isRaffleAdmin(userId, raffleId)

		//fails if any ticket sold
		isTicketSold(raffleId)

		return prisma.mutation.deletePrize({
			where: {
				id
			}
		}, info)
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

		//fails if not admin
		isRaffleAdmin(userId, raffleId)

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
			throw new Error("User already added to this raffle.")
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
			},
			info
		)
	},
	async updateUserRaffle(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserId(request)
		const raffleId = args.id
		const userToEdit = args.userId

		//fails if not admin
		isRaffleAdmin(userId, raffleId)

		return prisma.mutation.updateUserRaffle({
				where: {
					AND: [{
							user: userToEdit
						},
						{
							raffle: raffleId
						}
					]
				},
				data
			},
			info
		)
	},
	async deleteUserRaffle(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserId(request)
		const userToDelete = args.id
	},
	async createOrder(parent, args, {
		prisma,
		request
	}, info) {
		const {
			data
		} = args
		const userId = getUserid(request)
		const sellerId = getUserId(data.tokenSeller, true, true)

		const isSeller = await prisma.query.userRaflle({
			where: {
				AND: [{
					user: userId
				}, {
					raffle: data.raffleId
				}]
			}
		})

		//if seller, it can define to whom he is selling
		if (isSeller) {
			return prisma.mutations.createOrder({
				raffleNumber: data.raffleNumber,
				paymentMethod: data.paymentMethod,
				buyer: data.buyerId,
				seller: userId,
				raffle: {
					connect: {
						id: data.raffleId
					}
				},
				status: data.orderStatus
			}, info)
		}

		//if not seller, status= RESERVADO and seller comes from the token created.
		return prisma.mutations.createOrder({
			raffleNumber: data.raffleNumber,
			paymentMethod: data.paymentMethod,
			buyer: userId,
			seller: sellerId,
			raffle: {
				connect: {
					id: data.raffleId
				}
			},
			status: 'RESERVADO'
		}, info)
	}
}

export {
	Mutation as
	default
}