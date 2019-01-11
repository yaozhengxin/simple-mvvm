
/* 数据绑定
    一旦更新_data中的某个属性数据，所有界面上直接或间接使用此属性的节点都会更新
 */
/* 
数据劫持 Observer 数据的观察者
    在vue中使用数据劫持的技巧实现数据绑定的效果
    基本思想：defineProperty()来监视data中所有属性的数据变化，一旦变化 就去更新界面
 */

//  11-15 5 00 



function Observer(data) {
    this.data = data;//保存data对象
    this.walk(data); // 走起
    
}

Observer.prototype = {
    walk: function(data) {
        var me = this; //Observer 实例
        //遍历data中所有的属性
        Object.keys(data).forEach(function(key) {
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        //响应式，实现数据和界面的绑定关系
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {

        var dep = new Dep();//创建属性对应的dep对象，dependence==>多个watcher==>表达式==>更新
        //通过间接的递归调用实现对data中所有层次属性的数据劫持
        var childObj = observe(val);//递归，对所有层次的子节点实现绑定

        //给data重新定义属性，为什么要重新定义，添加getter/setter方法
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function() { 
                if (Dep.target) {
                    dep.depend();//建立dep与watcher之间的关系
                }
                return val;
            },
            set: function(newVal) {//监视key属性的变化，更新界面
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知所有相关的订阅者watcher
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    //被观察的必须是一个对象
    if (!value || typeof value !== 'object') {
        return;
    }
    //数据的观察者
    return new Observer(value);
};




/* 
    它的实例什么时候创建?
        初始化时给data的属性进行数据劫持时创建
    个数？
        与data中的属性一一对应
    DEP的结构
        id：标识
 */

var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];//多个watcher的数组
}

Dep.prototype = { 
    addSub: function(sub) {//添加watcher到dep中
        this.subs.push(sub);
    },
    //去建立dep和watcher之间的关系
    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {//遍历所有watcher，通知watcher更新
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};

Dep.target = null;