import getUserId from '../utils/getUserId'

const Query = {
    users(parent, args, {
        prisma
    }, info) {

        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }

        if (args.query) {
            opArgs.where = {
                OR: [{
                    name_contains: args.query
                }]
            }
        }

        return prisma.query.users(opArgs, info)
    },
    me(parent, args, {
        prisma,
        request
    }, info) {
        const userId = getUserId(request)

        if (!userId) {
            throw new Error('Unable to fetch user.')
        }

        return prisma.query.user({
            where: {
                id: userId
            }
        }, info)
    },
    async raffles(parent, args, {
        prisma,
        request
    }, info) {
        const userId = getUserId(request)
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }

        if (!userId) {
            throw new Error('Unable to fetch raffles.')
        }

        const userFromDb = await prisma.query.user({
            where: {
                id: userId
            }
        })

        if (userFromDb.siteRole !== 'ADMIN') {
            throw new Error('Unable to fetch raffles.')
        }

        return prisma.query.raffles(opArgs, info)
    },
    async myRaffles(parent, args, {
        prisma,
        request
    }, info) {
        const userId = getUserId(request)
        const opArgs = {
            first: args.first,
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }

        if (args.query) {
            opArgs.where = {
                where: {
                    AND: [
                        ...opArgs.where,
                        {
                            admins_every: {
                                id: userId
                            }
                        }
                    ]
                }
            }
        }

        if (!userId) {
            throw new Error('Unable to fetch raffles.')
        }

        const userFromDb = await prisma.query.user({
            where: {
                id: userId
            }
        })

        if (userFromDb.siteRole !== 'ADMIN') {
            throw new Error('Unable to fetch raffles.')
        }

        return prisma.query.raffles(opArgs, info)
    }

}

export {
    Query as
    default
}