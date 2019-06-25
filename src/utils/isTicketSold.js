import prisma from '../prisma'

const isTicketSold = async (raffleId) => {
    const isSold = await prisma.query.order({
        where: {
            raffle: raffleId
        }
    })

    if (isSold) {
        throw new Error("You cannot remove this prize. Tickets already sold.")
    }

    return false
}
export {
    isTicketSold as
    default
}