
/**
 * 一大类----数据代理
 * 1，数据代理：通过vm对象来代理对另一对象中属性的操作（读/写）
 * 2，vue数据代理，通过vm对象代理data对象中所有属性的操作
 * 3，好处：更方便的操作data中的数据
 * 基本实现流程
 * a，通过Object.defineProperty给vm添加与data对象的属性对饮的属性描述符
 * b，所有添加的属性都包含getter/setter
 * c，getter/setter内部去操作data中对应的属性读/写操作
 *
 */

/**
* 相当于vue的构造函数
*/
function MVVM(options) {
    //将配置对象保存到vm中
    this.$options = options || {};
    // 将配置对象data对象保存在vm的data中
    var data = this._data = this.$options.data;
    var me = this;

    // 数据代理
    // 实现 vm.xxx -> vm._data.xxx
    //遍历对象的所有属性
    Object.keys(data).forEach(function (key) {
        //对指定的属性实现代理
        me._proxyData(key);
    });

    this._initComputed();
    
    observe(data, this);

    //传入 选择器    this指vm,编译器编译解析模板
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    $watch: function (key, cb, options) {
        new Watcher(this, key, cb);
    },
    /**
     * 实现数据代理的方法
     */
    _proxyData: function (key, setter, getter) {
         //给vm添加指定属性名称的属性（使用属性描述符）
        var me = this;
        setter = setter ||
            Object.defineProperty(me, key, {
                 //不能重新定义，防止别人修改
                configurable: false,
                 //可以枚举遍历
                enumerable: true,
                //当通过vm.xxx读取属性时调用，从$data中读取对应属性返回---代理读操作
                get: function proxyGetter() {
                    return me._data[key];
                },
                //当通过vm.xxx==value时，value被保存$data中同样的属性名的值中---代理写操作
                set: function proxySetter(newVal) {
                    me._data[key] = newVal;
                }
            });
    },

    _initComputed: function () {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get,
                    set: function () { }
                });
            });
        }
    }
};