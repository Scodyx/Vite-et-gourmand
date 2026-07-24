package fr.vitegourmand.statistics.service;
import fr.vitegourmand.order.entity.CustomerOrder;
import fr.vitegourmand.order.repository.CustomerOrderRepository;
import fr.vitegourmand.statistics.document.MenuStatisticsDocument;
import fr.vitegourmand.statistics.dto.StatisticsDtos.*;
import fr.vitegourmand.statistics.repository.MenuStatisticsRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
@Service
public class StatisticsService {
 private final CustomerOrderRepository orders;private final MenuStatisticsRepository statistics;
 public StatisticsService(CustomerOrderRepository o,MenuStatisticsRepository s){orders=o;statistics=s;}
 public List<MenuStat> rebuild(){
  record Key(Long menuId,String title,LocalDate date){}
  record Totals(long count,BigDecimal gross,BigDecimal discount,BigDecimal delivery,BigDecimal total){
   Totals add(CustomerOrder o){return new Totals(count+1,gross.add(o.getMenuAmount()),discount.add(o.getDiscountAmount()),delivery.add(o.getDeliveryAmount()),total.add(o.getTotalAmount()));}}
  Map<Key,Totals> grouped=new HashMap<>();
  for(var o:orders.findAllBillable()){var key=new Key(o.getMenu().getId(),o.getMenu().getTitle(),o.getPrestationDate());
   grouped.compute(key,(k,v)->(v==null?new Totals(0,zero(),zero(),zero(),zero()):v).add(o));}
  statistics.deleteAll();
  var docs=grouped.entrySet().stream().map(e->new MenuStatisticsDocument(null,e.getKey().menuId(),e.getKey().title(),e.getValue().count(),
   e.getValue().gross(),e.getValue().discount(),e.getValue().delivery(),e.getValue().total(),e.getKey().date(),Instant.now())).toList();
  return statistics.saveAll(docs).stream().map(this::view).toList();
 }
 public List<MenuStat> menus(LocalDate from,LocalDate to,Long menuId){return statistics.findByStatisticsDateBetweenOrderByTotalRevenueDesc(from,to).stream()
  .filter(s->menuId==null||menuId.equals(s.menuId())).map(this::view).toList();}
 public Summary summary(LocalDate from,LocalDate to){
  var list=statistics.findByStatisticsDateBetweenOrderByTotalRevenueDesc(from,to);
  return new Summary(list.stream().mapToLong(MenuStatisticsDocument::orderCount).sum(),sum(list,MenuStatisticsDocument::grossRevenue),
   sum(list,MenuStatisticsDocument::discountTotal),sum(list,MenuStatisticsDocument::deliveryRevenue),sum(list,MenuStatisticsDocument::totalRevenue));}
 private BigDecimal sum(List<MenuStatisticsDocument> list,java.util.function.Function<MenuStatisticsDocument,BigDecimal> fn){return list.stream().map(fn).reduce(zero(),BigDecimal::add);}
 private BigDecimal zero(){return BigDecimal.ZERO.setScale(2);}
 private MenuStat view(MenuStatisticsDocument s){return new MenuStat(s.menuId(),s.menuTitle(),s.statisticsDate(),s.orderCount(),s.grossRevenue(),s.discountTotal(),s.deliveryRevenue(),s.totalRevenue());}
}
