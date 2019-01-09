/**
 * 1，将el的所有子节点取出，添加到一个新建的文档fragment对象中
 * 2，对fragment中的所有层次子节点递归进行编译解析处理
 *      a, 对{{}}表达式文本节点进行解析
 *              根据正则对象得到匹配出的表达式字符串：子匹配/RegExp，$1 name
 *              从data中读取表达式对应的属性值 value
 *              将属性值设置为文本节点的textContent
 *      b，对元素节点的指令属性进行解析
 *           事件指令解析 v-click="show"
 *              从指令中读取事件名 v-click
 *              根据指令的值（表达式）从methods中得到对应的事件处理回调函数对象 show
 *              给当前元素节点绑定指定事件名和回调函数的dom事件监听
 *              指令解析完成后，移除次指令属性
 *           一般指令解析
 *              得到指令名和指令值  text/html/class
 *              从data中根据表达式得到对应的值
 *              根据指令名确定需要操作元素节点的什么属性
 *                  v-text-textContent 属性
 *                  v-html-innerHTML 属性
 *                  v-class-className 属性
 *              将得到的表达式的值设置到对应的属性上
 *              移除元素的指令属性
 *              
 * 
 * 3，将解析后的fragment添加到el中显示
 * 
 */

function Compile(el, vm) {
    //保存vm 到compile
    this.$vm = vm;
    //判断el是不是元素节点  node.nodeType == 1  是元素节点
    //如果是元素节点就是el  否则是选择器查找el
    //将el的元素对象保存到compile
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);

    // 判断$el是否存在
    if (this.$el) {
        /**
         * 2--->to  写法  将node节点转化成 fragment  ，并返回一个fragment
         * 取出el中所有的子节点保存到fragment中
         */

        this.$fragment = this.node2Fragment(this.$el);
        //初始化显示，编译内存fragment中所有层次！的节点
        this.init();
        //将内存编译好的fragment 添加到页面的 el中
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    //将node节点转化成 fragment
    node2Fragment: function (el) {
        //创建一个fragment
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生所有的节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        //返回fragment中
        return fragment;
    },

    init: function () {
        //编译fragment所有的子节点
        this.compileElement(this.$fragment);
    },

    compileElement: function (el) {
        //取出最外层的子节点
        var childNodes = el.childNodes,
            //保存this的实例  this ☞ compile
            me = this;

        //伪数组转真数组,遍历所有子节点，有文本节点 和 元素节点
        //元素节点编译执行，文本节点编译{{}}表达式
        [].slice.call(childNodes).forEach(function (node) {
            //得到节点的文本内容
            var text = node.textContent;
            //创建正则对象匹配 {{name}}  ()子匹配
            var reg = /\{\{(.*)\}\}/;

            //匹配是否是元素节点
            if (me.isElementNode(node)) {
                //编译元素节点里所有的指令的，指令以标签属性的形式写上去的
                me.compile(node);

                //匹配是否是文本节点   && 是否和正则匹配
            } else if (me.isTextNode(node) && reg.test(text)) {
                //编译{{}}表达式 文本节点的方法
                me.compileText(node, RegExp.$1);
            }

            //判断这个子节点是否有孩子，有孩子继续调用
            //实现对层次的子节点进行遍历编译，方式是递归
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function (node) {
        //得到标签的所有属性，伪数组  v-on：click= "show"
        var nodeAttrs = node.attributes,
            me = this;

        //遍历所有属性得到属性名
        [].slice.call(nodeAttrs).forEach(function (attr) {
            //得到属性名：   v-on：click
            var attrName = attr.name;
            //判断是否是指令属性，判断条件是  v-开头
            if (me.isDirective(attrName)) {
                //得到属性值--表达式   shou
                var exp = attr.value;
                // 从属性名中得到指令名   on：click
                var dir = attrName.substring(2);
                // 是否是事件指令  判断条件  是否包含on
                if (me.isEventDirective(dir)) {
                    //解析处理事件指令
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else {
                    // 普通指令
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                //移除指令属性
                node.removeAttribute(attrName);
            }
        });
    },

    compileText: function (node, exp) {
        //编译工具
        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function (attr) {
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function (dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function (node) {
        return node.nodeType == 1;
    },

    isTextNode: function (node) {
        return node.nodeType == 3;
    }
};

// 指令处理集合
// 包含多个解析指令的方法的工具对象
var compileUtil = {
    //解析{{}}表达式  {{}}☞  v-text
    /**
     * 
     * @param {*} node 节点
     * @param {*} vm vm
     * @param {*} exp 正则
     */

    text: function (node, vm, exp) {
        //数据bing
        this.bind(node, vm, exp, 'text');
    },
    //解析v-html
    html: function (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    //解析v-model
    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model');
        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },
    //解析v-class
    class: function (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },


    bind: function (node, vm, exp, dir) {
        //除了事件指令都会进入bind
        //得到更新器的函数
        var updaterFn = updater[dir + 'Updater'];
        //调用更新函数给特定的节点赋值
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        // Watcher: 数据的订阅者，数据的变化会通知到Watcher，然后由Watcher进行相应的操作，例如更新视图
        // exp 表达式所对应的属性变化时会执行回调
        /*  它的实例什么时候创建?
                初始化解析大括号表达式一般指定时创建
            个数？
                与模板中表达式（不包含事件指令）一一对应
            Watcher的结构
         */
        new Watcher(vm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    eventHandler: function (node, vm, exp, dir) {
        //得到是将类型/事件名   click
        var eventType = dir.split(':')[1],
            //从methods对象中的到表达式所对应的函数（事件回调函数）
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            //给节点绑定事件名和回调函数（强制绑定this为vm）的DOM事件监听
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    //从vm中得到表达式所对应的值   a.b.c.d.e
    _getVMVal: function (vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function (vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

// 包含多个更新节点的方法的工具对象--提供给compileUtil使用
var updater = {
    //操作节点的textContent
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    //操作节点的innerHTML
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    //操作节点的className
    classUpdater: function (node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },
    //操作节点的value
    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};