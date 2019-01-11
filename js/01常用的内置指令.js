/*
1，v-text: 更新元素的textContent
2，v-html：更新元素的innerHTML
3，v-if： 如果时true，当前标签才会输出到页面上
4，v-else：如果为false，当前标签才会输出到页面上
5，v-show：通过控制display样式来控制显示/隐藏
6，v-for：遍历数组/对象
7，v-on：绑定事件监听，一般些@
8，v-bind：强制绑定解析表达式，可以省略v-bind
9，v-model：双向数据绑定
10，ref ： 指定唯一标识，vue通过$refs属性访问这个元素对象
11，v-cloak：防止闪现，与css配合【v-cloak】{display：none}

 */


/*
1，注册全局指令
Vue.dirtective('my-directive', function (el, binding) {
    el.innerHTML = binding.value.toUperCase()
})
2，注册局部指令
    dirtective: {
        'my-directive': {
            bind(el, binding){
                el.innerHTML = binding.value.toUperCase()
            }
        }
    }
3，v-my-directive="xxx"
 */



