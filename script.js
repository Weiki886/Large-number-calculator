document.addEventListener('DOMContentLoaded', function() {
    const num1Input = document.getElementById('num1');
    const num2Input = document.getElementById('num2');
    const operationSelect = document.getElementById('operation');
    const calculateButton = document.getElementById('calculate');
    const resultDiv = document.getElementById('result');

    calculateButton.addEventListener('click', calculate);
    
    // 处理输入框中的键盘Enter事件
    num1Input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculate();
    });
    
    num2Input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculate();
    });
    
    // 当操作类型变更时检查是否需要隐藏第二个输入框（阶乘操作）
    operationSelect.addEventListener('change', function() {
        if (operationSelect.value === 'factorial') {
            num2Input.style.display = 'none';
            num2Input.value = '';
        } else {
            num2Input.style.display = 'block';
        }
    });

    function calculate() {
        // 获取并验证输入
        let num1 = num1Input.value.trim();
        let num2 = num2Input.value.trim();
        const operation = operationSelect.value;
        
        // 对于阶乘操作，只需要第一个数字
        if (operation !== 'factorial' && (!isValidNumber(num1) || !isValidNumber(num2))) {
            resultDiv.textContent = '请输入有效的数字';
            return;
        } else if (operation === 'factorial' && !isValidNumber(num1)) {
            resultDiv.textContent = '请输入有效的数字';
            return;
        }
        
        // 对于阶乘操作，检查是否为非负整数
        if (operation === 'factorial') {
            if (num1.includes('.') || num1.includes('-') || !isValidPositiveInteger(num1)) {
                resultDiv.textContent = '阶乘运算只接受非负整数';
                return;
            }
        }
        
        // 对于次方操作，指数必须是整数
        if (operation === 'power' && num2.includes('.')) {
            resultDiv.textContent = '指数必须是整数';
            return;
        }
        
        // 根据操作类型执行相应的大数计算
        let result;
        try {
            switch (operation) {
                case 'add':
                    result = bigIntAdd(num1, num2);
                    break;
                case 'subtract':
                    result = bigIntSubtract(num1, num2);
                    break;
                case 'multiply':
                    result = bigIntMultiply(num1, num2);
                    break;
                case 'divide':
                    result = bigIntDivide(num1, num2);
                    break;
                case 'power':
                    result = bigIntPower(num1, num2);
                    break;
                case 'factorial':
                    result = bigIntFactorial(num1);
                    break;
                default:
                    result = '不支持的操作';
            }
            
            resultDiv.textContent = result;
        } catch (error) {
            resultDiv.textContent = '计算错误: ' + error.message;
        }
    }
    
    // 检查输入是否为有效的正整数
    function isValidPositiveInteger(str) {
        return /^\d+$/.test(str);
    }
    
    // 验证输入是否为有效数字（可以包含小数点和负号）
    function isValidNumber(str) {
        return /^-?\d*\.?\d*$/.test(str) && str !== '' && str !== '.';
    }
    
    // 大数加法
    function bigIntAdd(a, b) {
        // 处理小数点
        const [aInt, aFrac = ''] = a.split('.');
        const [bInt, bFrac = ''] = b.split('.');
        
        // 对齐小数部分
        const maxFracLen = Math.max(aFrac.length, bFrac.length);
        const alignedAFrac = aFrac.padEnd(maxFracLen, '0');
        const alignedBFrac = bFrac.padEnd(maxFracLen, '0');
        
        // 如果有小数部分，先计算小数加法
        if (maxFracLen > 0) {
            // 计算整数部分
            let intResult = addStrings(aInt, bInt);
            
            // 计算小数部分
            let fracResult = addStrings(alignedAFrac, alignedBFrac);
            
            // 如果小数部分有进位
            if (fracResult.length > maxFracLen) {
                intResult = addStrings(intResult, '1');
                fracResult = fracResult.substring(1);
            }
            
            return `${intResult}.${fracResult}`;
        } else {
            return addStrings(a, b);
        }
    }
    
    // 大数减法
    function bigIntSubtract(a, b) {
        // 检查是否需要处理负数
        if (a.startsWith('-') && !b.startsWith('-')) {
            return '-' + bigIntAdd(a.substring(1), b);
        } else if (!a.startsWith('-') && b.startsWith('-')) {
            return bigIntAdd(a, b.substring(1));
        } else if (a.startsWith('-') && b.startsWith('-')) {
            return bigIntSubtract(b.substring(1), a.substring(1));
        }
        
        // 处理小数点
        const [aInt, aFrac = ''] = a.split('.');
        const [bInt, bFrac = ''] = b.split('.');
        
        // 对齐小数部分
        const maxFracLen = Math.max(aFrac.length, bFrac.length);
        const alignedAFrac = aFrac.padEnd(maxFracLen, '0');
        const alignedBFrac = bFrac.padEnd(maxFracLen, '0');
        
        // 比较两个数的大小
        const isALarger = compareNumbers(a, b);
        
        // 如果a < b，返回-(b-a)
        if (isALarger === -1) {
            return '-' + bigIntSubtract(b, a);
        }
        
        // 如果有小数部分
        if (maxFracLen > 0) {
            // 先处理小数部分
            let fracResult = '';
            let borrow = 0;
            
            for (let i = maxFracLen - 1; i >= 0; i--) {
                let digitA = parseInt(alignedAFrac[i] || '0');
                let digitB = parseInt(alignedBFrac[i] || '0');
                
                digitA -= borrow;
                
                if (digitA < digitB) {
                    digitA += 10;
                    borrow = 1;
                } else {
                    borrow = 0;
                }
                
                fracResult = (digitA - digitB) + fracResult;
            }
            
            // 处理整数部分
            let intResult = subtractStrings(aInt, bInt, borrow);
            
            // 去除结果中的前导零和末尾零
            fracResult = fracResult.replace(/0+$/, '');
            
            if (fracResult === '') {
                return intResult;
            } else {
                return `${intResult}.${fracResult}`;
            }
        } else {
            return subtractStrings(a, b);
        }
    }
    
    // 大数乘法
    function bigIntMultiply(a, b) {
        // 处理符号
        const isNegative = (a.startsWith('-') && !b.startsWith('-')) || 
                           (!a.startsWith('-') && b.startsWith('-'));
        a = a.replace('-', '');
        b = b.replace('-', '');
        
        // 处理小数点
        let decimalPlaces = 0;
        
        if (a.includes('.')) {
            decimalPlaces += a.length - a.indexOf('.') - 1;
            a = a.replace('.', '');
        }
        
        if (b.includes('.')) {
            decimalPlaces += b.length - b.indexOf('.') - 1;
            b = b.replace('.', '');
        }
        
        // 去掉前导零
        a = a.replace(/^0+/, '');
        b = b.replace(/^0+/, '');
        
        if (a === '' || b === '') return '0';
        
        const result = multiplyStrings(a, b);
        
        // 添加小数点
        let finalResult = result;
        if (decimalPlaces > 0) {
            if (result.length <= decimalPlaces) {
                finalResult = '0.' + '0'.repeat(decimalPlaces - result.length) + result;
            } else {
                finalResult = result.slice(0, result.length - decimalPlaces) + '.' + 
                              result.slice(result.length - decimalPlaces);
            }
            
            // 去除末尾的零
            finalResult = finalResult.replace(/\.?0+$/, '');
        }
        
        return (isNegative ? '-' : '') + finalResult;
    }
    
    // 大数除法
    function bigIntDivide(a, b) {
        // 处理特殊情况
        if (b === '0') throw new Error('除数不能为零');
        if (a === '0') return '0';
        
        // 处理符号
        const isNegative = (a.startsWith('-') && !b.startsWith('-')) || 
                           (!a.startsWith('-') && b.startsWith('-'));
        a = a.replace('-', '');
        b = b.replace('-', '');
        
        // 处理小数点，将小数转为整数
        let decimalShift = 0;
        
        if (a.includes('.')) {
            decimalShift -= a.length - a.indexOf('.') - 1;
            a = a.replace('.', '');
        }
        
        if (b.includes('.')) {
            decimalShift += b.length - b.indexOf('.') - 1;
            b = b.replace('.', '');
        }
        
        // 去掉前导零
        a = a.replace(/^0+/, '');
        b = b.replace(/^0+/, '');
        
        // 为了保证足够精度，为被除数增加足够的零
        const precision = 100; // 最大支持100位小数
        a = a + '0'.repeat(precision);
        
        // 执行长除法
        const quotient = longDivision(a, b);
        
        // 处理小数点位置
        let result = quotient;
        const decimalPos = quotient.length - precision + decimalShift;
        
        if (decimalPos <= 0) {
            // 小数点在最前面
            result = '0.' + '0'.repeat(-decimalPos) + quotient.replace(/0+$/, '');
        } else if (decimalPos < quotient.length) {
            // 小数点在中间
            result = quotient.slice(0, decimalPos) + '.' + quotient.slice(decimalPos).replace(/0+$/, '');
        } else {
            // 小数点在后面或没有小数部分
            result = quotient + '0'.repeat(decimalPos - quotient.length);
        }
        
        // 去除末尾的零和无意义的小数点
        result = result.replace(/\.?0+$/, '');
        
        return (isNegative ? '-' : '') + result;
    }
    
    // 辅助函数：字符串加法
    function addStrings(num1, num2) {
        let i = num1.length - 1;
        let j = num2.length - 1;
        let carry = 0;
        let result = '';
        
        while (i >= 0 || j >= 0 || carry > 0) {
            const digit1 = i >= 0 ? parseInt(num1[i]) : 0;
            const digit2 = j >= 0 ? parseInt(num2[j]) : 0;
            const sum = digit1 + digit2 + carry;
            
            result = (sum % 10) + result;
            carry = Math.floor(sum / 10);
            
            i--;
            j--;
        }
        
        return result;
    }
    
    // 辅助函数：字符串减法
    function subtractStrings(num1, num2, initialBorrow = 0) {
        let i = num1.length - 1;
        let j = num2.length - 1;
        let borrow = initialBorrow;
        let result = '';
        
        while (i >= 0 || j >= 0) {
            let digit1 = i >= 0 ? parseInt(num1[i]) : 0;
            let digit2 = j >= 0 ? parseInt(num2[j]) : 0;
            
            digit1 -= borrow;
            
            if (digit1 < digit2) {
                digit1 += 10;
                borrow = 1;
            } else {
                borrow = 0;
            }
            
            result = (digit1 - digit2) + result;
            
            i--;
            j--;
        }
        
        // 移除结果前导零
        return result.replace(/^0+/, '') || '0';
    }
    
    // 辅助函数：比较两个数的大小
    function compareNumbers(a, b) {
        // 移除前导零
        a = a.replace(/^0+/, '');
        b = b.replace(/^0+/, '');
        
        // 处理小数点
        const [aInt, aFrac = ''] = a.split('.');
        const [bInt, bFrac = ''] = b.split('.');
        
        // 比较整数部分长度
        if (aInt.length !== bInt.length) {
            return aInt.length > bInt.length ? 1 : -1;
        }
        
        // 比较整数部分
        for (let i = 0; i < aInt.length; i++) {
            if (aInt[i] !== bInt[i]) {
                return aInt[i] > bInt[i] ? 1 : -1;
            }
        }
        
        // 比较小数部分
        const maxFracLen = Math.max(aFrac.length, bFrac.length);
        const alignedAFrac = aFrac.padEnd(maxFracLen, '0');
        const alignedBFrac = bFrac.padEnd(maxFracLen, '0');
        
        for (let i = 0; i < maxFracLen; i++) {
            if (alignedAFrac[i] !== alignedBFrac[i]) {
                return alignedAFrac[i] > alignedBFrac[i] ? 1 : -1;
            }
        }
        
        // 两数相等
        return 0;
    }
    
    // 辅助函数：字符串乘法
    function multiplyStrings(num1, num2) {
        const m = num1.length;
        const n = num2.length;
        const result = Array(m + n).fill(0);
        
        for (let i = m - 1; i >= 0; i--) {
            for (let j = n - 1; j >= 0; j--) {
                const product = parseInt(num1[i]) * parseInt(num2[j]);
                const p1 = i + j;
                const p2 = i + j + 1;
                
                const sum = product + result[p2];
                
                result[p2] = sum % 10;
                result[p1] += Math.floor(sum / 10);
            }
        }
        
        // 移除前导零
        while (result.length > 1 && result[0] === 0) {
            result.shift();
        }
        
        return result.join('');
    }
    
    // 辅助函数：长除法
    function longDivision(dividend, divisor) {
        let result = '';
        let remainder = '';
        
        for (let i = 0; i < dividend.length; i++) {
            remainder += dividend[i];
            
            // 移除前导零
            remainder = remainder.replace(/^0+/, '');
            if (remainder === '') remainder = '0';
            
            let quotientDigit = 0;
            
            // 找到当前位的商
            while (compareNumbers(remainder, divisor) >= 0) {
                remainder = subtractStrings(remainder, divisor);
                quotientDigit++;
            }
            
            result += quotientDigit;
        }
        
        // 移除前导零
        result = result.replace(/^0+/, '');
        if (result === '') result = '0';
        
        return result;
    }
    
    // 大数次方计算
    function bigIntPower(base, exponent) {
        // 处理特殊情况
        if (exponent === '0') return '1';
        if (base === '0') return '0';
        if (base === '1') return '1';
        
        // 如果指数为负数，结果是 1/(base^abs(exponent))
        const isNegativeExponent = exponent.startsWith('-');
        if (isNegativeExponent) {
            exponent = exponent.substring(1);
            const positiveResult = bigIntPower(base, exponent);
            return bigIntDivide('1', positiveResult);
        }
        
        // 转换为整数
        exponent = exponent.replace(/^0+/, '');
        let exp = parseInt(exponent);
        
        // 处理基数的小数点和符号
        const isNegativeBase = base.startsWith('-');
        if (isNegativeBase) {
            base = base.substring(1);
            // 如果指数是奇数，结果为负
            return (exp % 2 === 1) ? '-' + calculatePower(base, exp) : calculatePower(base, exp);
        } else {
            return calculatePower(base, exp);
        }
    }
    
    // 计算正数的整数次方
    function calculatePower(base, exponent) {
        // 移除基数中的小数点
        let decimalPlaces = 0;
        if (base.includes('.')) {
            decimalPlaces = base.length - base.indexOf('.') - 1;
            base = base.replace('.', '');
        }
        
        let result = '1';
        
        // 快速幂算法
        while (exponent > 0) {
            if (exponent % 2 === 1) {
                result = multiplyStrings(result, base);
            }
            base = multiplyStrings(base, base);
            exponent = Math.floor(exponent / 2);
        }
        
        // 调整小数点位置
        const totalDecimalPlaces = decimalPlaces * parseInt(exponent);
        if (totalDecimalPlaces > 0) {
            if (result.length <= totalDecimalPlaces) {
                result = '0.' + '0'.repeat(totalDecimalPlaces - result.length) + result;
            } else {
                result = result.slice(0, result.length - totalDecimalPlaces) + '.' + 
                         result.slice(result.length - totalDecimalPlaces);
            }
            
            // 去除末尾的零
            result = result.replace(/\.?0+$/, '');
        }
        
        return result;
    }
    
    // 大数阶乘计算
    function bigIntFactorial(n) {
        // 移除前导零
        n = n.replace(/^0+/, '');
        
        // 特殊情况处理
        if (n === '' || n === '0' || n === '1') return '1';
        
        // 由于n可能是大数，我们需要逐步减1并相乘
        let result = n;
        let current = n;
        
        while (current !== '1') {
            current = subtractStrings(current, '1');
            result = multiplyStrings(result, current);
        }
        
        return result;
    }
}); 