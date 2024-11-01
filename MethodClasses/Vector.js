export default class Vector {
    static add(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]
    }
    static dot(v1, v2) {
        return (v1[0] * v2[0]) + (v1[1] * v2[1]) + (v1[2] * v2[2])
    }
    static length(v1) {
        return Math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2)
    }
    static scale(v1, new_length) {
        return v1.map(e => e * (new_length / Vector.length(v1)))
    }
    static mat_mult(v3x3, v3x1) {
        return [
            v3x3[0][0] * v3x1[0] + v3x3[0][1] * v3x1[1] + v3x3[0][2] * v3x1[2],
            v3x3[1][0] * v3x1[0] + v3x3[1][1] * v3x1[1] + v3x3[1][2] * v3x1[2],
            v3x3[2][0] * v3x1[0] + v3x3[2][1] * v3x1[1] + v3x3[2][2] * v3x1[2]
        ]
    }
}