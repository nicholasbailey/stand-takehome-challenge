import math from '../mathjs-extended';


describe('mathjs-extended', () => {
    it("should handle string equality comparisons", () => {
        const result = math.evaluate('"hello" == "hello"');
        expect(result).toBe(true);
        const result2 = math.evaluate('"hello" == "world"');
        expect(result2).toBe(false);
    });

    it('should handle array iteration', () => {
        const result = math.evaluate('each([1, 2, 3], f(x) = x > 1)');
        expect(result.data).toEqual([
            { value: true, context: 1 },
            { value: true, context: 2 },
            { value: false, context: 3 }
        ]);
    });
});