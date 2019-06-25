import prisma from '../prisma'

const isRaffleAdmin = async (userId, raffleId) => {
    const admin = await prisma.query.userRaffle({
        where: {
            AND: [{
                    user: userId
                },
                {
                    raffle: raffleId
                },
                {
                    userRole: "ADMIN"
                }
            ]
        }
    })

    if (!admin) {
        throw new Error("You cannot edit this raffle.")
    }

    return true
}

export {
    isRaffleAdmin as
    default
}