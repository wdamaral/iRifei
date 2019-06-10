import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken'
import getUserId from '../utils/getUserId'
import hashPassword from '../utils/hashPassword'

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

        if (emailTaken) {
            throw new Error('Email already registered.')
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
                email: data.email
            }
        })

        if (!user) {
            throw new Error('Unable to login.')
        }

        const isMatch = await bcrypt.compare(data.password, user.password)

        if (!isMatch) {
            throw new Error('User/Password incorrect.')
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
        }, info)

    },
    async updateUser(parent, args, {
        prisma,
        request
    }, info) {
        const {
            data
        } = args

        const userId = getUserId(request)

        if (typeof data.password === 'string') {
            data.password = await hashPassword(data.password)
        }

        return prisma.mutation.updateUser({
            where: {
                id: userId
            },
            data
        }, info)
    }

}

export {
    Mutation as
    default
}